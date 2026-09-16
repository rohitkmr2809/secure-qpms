import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import QuestionPaper from '@/models/QuestionPaper';
import StatusBadge from '@/components/StatusBadge';
import { FilePlus, Eye, Calendar, User, BookOpen } from 'lucide-react';

export default async function QuestionPapersPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect('/login');
  }

  await connectToDatabase();

  let query: any = {};
  if (user.role === 'QUESTION_SETTER') {
    query = { 'createdBy.id': user.id };
  } else if (user.role === 'REVIEWER') {
    query = { status: { $in: ['SUBMITTED', 'APPROVED', 'REJECTED', 'SCHEDULED', 'RELEASED'] } };
  } else if (user.role === 'EXAM_OFFICER') {
    query = { status: { $in: ['APPROVED', 'SCHEDULED', 'RELEASED'] } };
  }

  const papers = await QuestionPaper.find(query)
    .select('-content')
    .sort({ updatedAt: -1 });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Question Papers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {user.role === 'QUESTION_SETTER'
              ? 'Manage and track your submitted examination question papers'
              : 'Secure repository of confidential competitive examination papers'}
          </p>
        </div>

        {(user.role === 'QUESTION_SETTER' || user.role === 'ADMIN') && (
          <Link
            href="/question-papers/create"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <FilePlus className="w-4 h-4" />
            <span>Create Question Paper</span>
          </Link>
        )}
      </div>

      {papers.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No question papers found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {user.role === 'QUESTION_SETTER'
              ? 'You have not authored any question papers yet. Click the button above to create one.'
              : 'There are no question papers currently available for your role.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Title & Subject</th>
                  <th className="px-5 py-3.5">Exam Name</th>
                  <th className="px-5 py-3.5">Exam Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Created By</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {papers.map((paper) => (
                  <tr key={paper._id.toString()} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-4 font-medium text-slate-900">
                      <div className="font-semibold text-sm text-slate-900">{paper.title}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <BookOpen className="w-3 h-3 text-emerald-600" />
                        <span>{paper.subject}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-slate-700">
                      <div>{paper.examName}</div>
                    </td>

                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{paper.examDate}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={paper.status} />
                    </td>

                    <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{paper.createdBy.name}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <Link
                        href={`/question-papers/${paper._id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View / Verify</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

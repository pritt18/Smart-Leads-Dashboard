import { useState } from "react";

import { useSelector } from "react-redux";

import type { Lead } from "../types/lead";

import API from "../api/axios";

import toast from "react-hot-toast";

import EditLeadModal from "./EditLeadModal";

interface Props {
  leads: Lead[];
  fetchLeads: () => void;
  darkMode: boolean;
}

const LeadsTable = ({
  leads,
  fetchLeads,
  darkMode,
}: Props) => {
  const auth = useSelector(
    (state: any) => state.auth
  );

  const [selectedLead, setSelectedLead] =
    useState<Lead | null>(null);

  const handleDelete = async (
    id: string
  ) => {
    try {
      await API.delete(`/leads/${id}`);

      toast.success(
        "Lead deleted successfully"
      );

      fetchLeads();
    } catch (error) {
      toast.error(
        "Failed to delete lead"
      );
    }
  };

  return (
    <>
      <div
        className={`overflow-x-auto rounded-xl shadow-md mt-6 ${
          darkMode
            ? "bg-gray-800 text-white"
            : "bg-white text-black"
        }`}
      >
        <table className="w-full">
          <thead
            className={`${
              darkMode
                ? "bg-gray-700 text-white"
                : "bg-gray-100 text-black"
            }`}
          >
            <tr>
              <th className="p-4 text-left">
                Name
              </th>

              <th className="p-4 text-left">
                Email
              </th>

              <th className="p-4 text-left">
                Status
              </th>

              <th className="p-4 text-left">
                Source
              </th>

              <th className="p-4 text-left">
                Created
              </th>

              <th className="p-4 text-left">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead._id}
                className={`border-t ${
                  darkMode
                    ? "border-gray-700 text-white"
                    : "text-black"
                }`}
              >
                <td className="p-4">
                  {lead.name}
                </td>

                <td className="p-4">
                  {lead.email}
                </td>

                <td className="p-4">
                  <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                    {lead.status}
                  </span>
                </td>

                <td className="p-4">
                  {lead.source}
                </td>

                <td className="p-4">
                  {new Date(
                    lead.createdAt
                  ).toLocaleDateString()}
                </td>

                <td className="p-4 flex gap-2">
                  {auth.user?.role ===
                  "admin" ? (
                    <>
                      <button
                        onClick={() =>
                          setSelectedLead(
                            lead
                          )
                        }
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            lead._id
                          )
                        }
                        className="bg-red-500 text-white px-4 py-2 rounded-lg"
                      >
                        Delete
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400 text-sm">
                      View Only
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLead && (
        <EditLeadModal
          lead={selectedLead}
          onClose={() =>
            setSelectedLead(null)
          }
          fetchLeads={fetchLeads}
        />
      )}
    </>
  );
};

export default LeadsTable;
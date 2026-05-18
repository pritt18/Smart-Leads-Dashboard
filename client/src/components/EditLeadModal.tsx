import { useState } from "react";

import toast from "react-hot-toast";

import API from "../api/axios";

import type { Lead } from "../types/lead";

interface Props {
  lead: Lead;
  onClose: () => void;
  fetchLeads: () => void;
}

const EditLeadModal = ({
  lead,
  onClose,
  fetchLeads,
}: Props) => {
  const [name, setName] =
    useState(lead.name);

  const [email, setEmail] =
    useState(lead.email);

  const [status, setStatus] =
    useState(lead.status);

  const [source, setSource] =
    useState(lead.source);

  const [loading, setLoading] =
    useState(false);

  const handleUpdate = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    try {
      setLoading(true);

      await API.put(
        `/leads/${lead._id}`,
        {
          name,
          email,
          status,
          source,
        }
      );

      toast.success(
        "Lead updated successfully"
      );

      fetchLeads();

      onClose();
    } catch (error) {
      toast.error(
        "Failed to update lead"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          Edit Lead
        </h2>

        <form
          onSubmit={handleUpdate}
          className="space-y-4"
        >
          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className="w-full border p-3 rounded-lg"
          />

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full border p-3 rounded-lg"
          />

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="w-full border p-3 rounded-lg"
          >
            <option value="New">
              New
            </option>

            <option value="Contacted">
              Contacted
            </option>

            <option value="Qualified">
              Qualified
            </option>

            <option value="Lost">
              Lost
            </option>
          </select>

          <select
            value={source}
            onChange={(e) =>
              setSource(e.target.value)
            }
            className="w-full border p-3 rounded-lg"
          >
            <option value="Website">
              Website
            </option>

            <option value="Instagram">
              Instagram
            </option>

            <option value="Referral">
              Referral
            </option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg"
            >
              {loading
                ? "Updating..."
                : "Update Lead"}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 py-3 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLeadModal;
import {
  useEffect,
  useState,
} from "react";

import { useSelector } from "react-redux";

import { CSVLink } from "react-csv";

import {
  Moon,
  Sun,
} from "lucide-react";

import API from "../api/axios";

import LeadsTable from "../components/LeadsTable";

import CreateLeadModal from "../components/CreateLeadModal";

import type { Lead } from "../types/lead";

const DashboardPage = () => {
  const auth = useSelector(
    (state: any) => state.auth
  );

  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");

  const [status, setStatus] =
    useState("");

  const [source, setSource] =
    useState("");

  const [sort, setSort] =
    useState("latest");

  const [showModal, setShowModal] =
    useState(false);

  const [page, setPage] =
    useState(1);

  const [totalPages, setTotalPages] =
    useState(1);

  const [darkMode, setDarkMode] =
    useState(false);

  const csvData = leads.map(
    (lead) => ({
      Name: lead.name,
      Email: lead.email,
      Status: lead.status,
      Source: lead.source,
      CreatedAt:
        new Date(
          lead.createdAt
        ).toLocaleDateString(),
    })
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () =>
      clearTimeout(timer);
  }, [search]);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const { data } =
        await API.get(
          `/leads?page=${page}&search=${debouncedSearch}&status=${status}&source=${source}&sort=${sort}`
        );

      setLeads(data.leads);

      setTotalPages(data.totalPages);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [
    page,
    debouncedSearch,
    status,
    source,
    sort,
  ]);

  return (
    <div
      className={`min-h-screen p-8 transition-all duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-black"
      }`}
    >
      {/* HEADER */}

      <div
        className={`p-6 rounded-xl shadow-md ${
          darkMode
            ? "bg-gray-800"
            : "bg-white"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">
            Smart Leads Dashboard
          </h1>

          <button
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
            className="p-3 rounded-full bg-gray-200 text-black"
          >
            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
        </div>

        <p className="text-lg">
          Welcome,
          <span className="font-semibold ml-2">
            {auth.user?.name}
          </span>
        </p>

        <p
          className={`mt-2 ${
            darkMode
              ? "text-gray-300"
              : "text-gray-600"
          }`}
        >
          Role:
          <span className="ml-2 capitalize">
            {auth.user?.role}
          </span>
        </p>
      </div>

      {/* FILTERS */}

      <div
        className={`p-4 rounded-xl shadow-md mt-6 flex flex-wrap gap-4 ${
          darkMode
            ? "bg-gray-800"
            : "bg-white"
        }`}
      >
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
          className="border p-3 rounded-lg flex-1 min-w-[220px] text-black"
        />

        <select
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
          className="border p-3 rounded-lg text-black"
        >
          <option value="">
            All Status
          </option>

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
            setSource(
              e.target.value
            )
          }
          className="border p-3 rounded-lg text-black"
        >
          <option value="">
            All Sources
          </option>

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

        <select
          value={sort}
          onChange={(e) =>
            setSort(
              e.target.value
            )
          }
          className="border p-3 rounded-lg text-black"
        >
          <option value="latest">
            Latest
          </option>

          <option value="oldest">
            Oldest
          </option>
        </select>
      </div>

      {/* ACTION BUTTONS */}

      <div className="flex justify-end gap-4 mt-6">
        <CSVLink
          data={csvData}
          filename="leads.csv"
          className="bg-green-600 text-white px-5 py-3 rounded-lg"
        >
          Export CSV
        </CSVLink>

        {auth.user?.role ===
          "admin" && (
          <button
            onClick={() =>
              setShowModal(
                true
              )
            }
            className="bg-blue-600 text-white px-5 py-3 rounded-lg"
          >
            + Add Lead
          </button>
        )}
      </div>

      {/* TABLE */}

      {loading ? (
        <div className="mt-6">
          Loading leads...
        </div>
      ) : (
        <LeadsTable
  leads={leads}
  fetchLeads={fetchLeads}
  darkMode={darkMode}
/>
      )}

      {/* PAGINATION */}

      <div className="flex justify-center gap-4 mt-6">
        <button
          disabled={page === 1}
          onClick={() =>
            setPage(page - 1)
          }
          className="bg-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 text-black"
        >
          Previous
        </button>

        <span className="flex items-center font-semibold">
          Page {page} of{" "}
          {totalPages}
        </span>

        <button
          disabled={
            page === totalPages
          }
          onClick={() =>
            setPage(page + 1)
          }
          className="bg-gray-300 px-4 py-2 rounded-lg disabled:opacity-50 text-black"
        >
          Next
        </button>
      </div>

      {/* MODAL */}

      {showModal && (
        <CreateLeadModal
          onClose={() =>
            setShowModal(
              false
            )
          }
          fetchLeads={fetchLeads}
        />
      )}
    </div>
  );
};

export default DashboardPage;
import {
  useEffect,
  useState,
} from "react";

import API from "../api/axios";

import LeadsTable from "../components/LeadsTable";

interface Lead {
  _id: string;
  name: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
}

const DashboardPage = () => {
  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [loading, setLoading] =
    useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const res =
        await API.get("/leads");

      setLeads(
        res.data.leads || []
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (
    id: string
  ) => {
    try {
      await API.delete(
        `/leads/${id}`
      );

      fetchLeads();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div
      style={{
        padding: "20px",
        background:
          "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          marginBottom: "20px",
          fontSize: "32px",
          fontWeight: "bold",
        }}
      >
        Smart Leads Dashboard
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <LeadsTable
          leads={leads}
          fetchLeads={fetchLeads}
          deleteLead={deleteLead}
        />
      )}
    </div>
  );
};

export default DashboardPage;
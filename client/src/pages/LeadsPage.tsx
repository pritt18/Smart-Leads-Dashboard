import { useEffect, useState } from "react";
import API from "../api/axios";
import LeadsTable from "../components/LeadsTable";

export interface Lead {
  _id: string;
  name: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
}

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const res = await API.get("/leads");

      setLeads(res.data.leads || []);
    } catch (error) {
      console.error("Error fetching leads", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteLead = async (id: string) => {
    try {
      await API.delete(`/leads/${id}`);

      fetchLeads();
    } catch (error) {
      console.error("Delete failed", error);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2
        style={{
          marginBottom: "20px",
        }}
      >
        Leads
      </h2>

      {loading ? (
        <p>Loading leads...</p>
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

export default LeadsPage;
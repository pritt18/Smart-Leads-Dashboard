import { CSVLink } from "react-csv";

interface Lead {
  _id: string;
  name: string;
  email: string;
  status: string;
  source: string;
  createdAt: string;
}

interface Props {
  leads: Lead[];
  fetchLeads: () => void;
  deleteLead: (id: string) => void;
}

const LeadsTable = ({
  leads,
  deleteLead,
}: Props) => {
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "20px",
          gap: "10px",
        }}
      >
        <CSVLink
          data={leads}
          filename="leads.csv"
          style={{
            background: "#16a34a",
            color: "#fff",
            padding: "10px 20px",
            borderRadius: "8px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Export CSV
        </CSVLink>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "#fff",
          borderRadius: "10px",
          overflow: "hidden",
        }}
      >
        <thead
          style={{
            background: "#f3f4f6",
          }}
        >
          <tr>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Email</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Source</th>
            <th style={thStyle}>Created</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr key={lead._id}>
              <td style={tdStyle}>
                {lead.name}
              </td>

              <td style={tdStyle}>
                {lead.email}
              </td>

              <td style={tdStyle}>
                <span
                  style={{
                    background:
                      "#dbeafe",
                    color: "#2563eb",
                    padding:
                      "5px 10px",
                    borderRadius:
                      "999px",
                    fontSize:
                      "14px",
                  }}
                >
                  {lead.status}
                </span>
              </td>

              <td style={tdStyle}>
                {lead.source}
              </td>

              <td style={tdStyle}>
                {new Date(
                  lead.createdAt
                ).toLocaleDateString()}
              </td>

              <td style={tdStyle}>
                <button
                  style={{
                    background:
                      "#ef4444",
                    color: "#fff",
                    border: "none",
                    padding:
                      "8px 14px",
                    borderRadius:
                      "6px",
                    cursor: "pointer",
                  }}
                  onClick={() =>
                    deleteLead(
                      lead._id
                    )
                  }
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const thStyle = {
  padding: "15px",
  textAlign: "left" as const,
};

const tdStyle = {
  padding: "15px",
  borderTop:
    "1px solid #e5e7eb",
};

export default LeadsTable;
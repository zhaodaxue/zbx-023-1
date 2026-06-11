import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import RepairForm from "@/pages/RepairForm";
import QueueBoard from "@/pages/QueueBoard";
import Sandbox from "@/pages/Sandbox";
import CompatibilityQuery from "@/pages/CompatibilityQuery";
import TraceTimeline from "@/pages/TraceTimeline";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<RepairForm />} />
          <Route path="/queue" element={<QueueBoard />} />
          <Route path="/sandbox" element={<Sandbox />} />
          <Route path="/compatibility" element={<CompatibilityQuery />} />
          <Route path="/trace" element={<TraceTimeline />} />
          <Route path="/trace/:id" element={<TraceTimeline />} />
        </Route>
      </Routes>
    </Router>
  );
}

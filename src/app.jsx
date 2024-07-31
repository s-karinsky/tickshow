import { BrowserRouter, Route, Routes, useParams } from "react-router-dom";
import Distribute from "pages/distribute";
import NotFound from "pages/not-found";
import Event from "pages/event";
import Loader from "pages/loader";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Loader />}>
          <Route path={"/event/:id"} element={<Event />} />
          <Route path={"/distribute"} element={<Distribute />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
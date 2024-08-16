import { useEffect } from "react"
import { BrowserRouter, Route, Routes, useParams } from "react-router-dom"
import Distribute from "pages/distribute"
import NotFound from "pages/not-found"
import Event from "pages/event"
import Loader from "pages/loader"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Loader />}>
          <Route path="*" element={<Event />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
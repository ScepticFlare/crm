import ReactDOM from "react-dom/client";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./assets/crm.css";

import App from "./App";
import UpdateNotice from "./components/UpdateNotice";

ReactDOM.createRoot(document.getElementById("root")).render(
    <>
        <App />
        {/* Offers a refresh when a newer frontend build has been deployed. */}
        <UpdateNotice />
    </>
);
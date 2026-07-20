import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import { Outlet } from "react-router-dom";

export default function MainLayout() {
    return (
        <div>

            <Sidebar />

            <main className="main-content">

                <TopNavbar />

                <div className="container-fluid p-4">

                    <Outlet />

                </div>

            </main>

        </div>
    );
}
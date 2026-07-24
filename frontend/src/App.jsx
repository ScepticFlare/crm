import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import Leads from "./pages/Leads";
import AddLead from "./pages/AddLead";
import EditLead from "./pages/EditLead";
import LeadDetails from "./pages/LeadDetails";

import Customers from "./pages/Customers";
import AddCustomer from "./pages/AddCustomer";
import EditCustomer from "./pages/EditCustomer";
import CustomerDetails from "./pages/CustomerDetails";

import Opportunities from "./pages/Opportunities";
import AddOpportunity from "./pages/AddOpportunity";
import EditOpportunity from "./pages/EditOpportunity";
import OpportunityDetails from "./pages/OpportunityDetails";

import FollowUps from "./pages/FollowUps";
import AddFollowUp from "./pages/AddFollowUp";
import EditFollowUp from "./pages/EditFollowUp";
import FollowUpDetails from "./pages/FollowUpDetails";

import MainLayout from "./layouts/MainLayout";
import ProtectedRoute from "./routes/ProtectedRoute";
import ConvertCustomer from "./pages/ConvertCustomer";

import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EditEmployee from "./pages/EditEmployee";
import ImportLeads from "./pages/ImportLeads";
function App() {

    return (

        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    element={
                        <ProtectedRoute>
                            <MainLayout />
                        </ProtectedRoute>
                    }
                >

                    {/* Dashboard */}
                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    {/* Leads */}
                    <Route
                        path="/leads"
                        element={<Leads />}
                    />

                    <Route
                        path="/leads/add"
                        element={<AddLead />}
                    />

                    <Route
                        path="/leads/:id"
                        element={<LeadDetails />}
                    />

                    <Route
                        path="/leads/edit/:id"
                        element={<EditLead />}
                    />

                    {/* Customers */}
                    <Route
                        path="/customers"
                        element={<Customers />}
                    />

                    <Route
                        path="/customers/add"
                        element={<AddCustomer />}
                    />

                    <Route
                        path="/customers/edit/:id"
                        element={<EditCustomer />}
                    />

                    <Route
                        path="/customers/:id"
                        element={<CustomerDetails />}
                    />

                    {/* Opportunities */}
                    <Route
                        path="/opportunities"
                        element={<Opportunities />}
                    />

                    <Route
                        path="/opportunities/add"
                        element={<AddOpportunity />}
                    />

                    <Route
                        path="/opportunities/edit/:id"
                        element={<EditOpportunity />}
                    />

                    <Route
                        path="/opportunities/:id"
                        element={<OpportunityDetails />}
                    />

                    {/* Follow Ups */}
                    <Route
                        path="/followups"
                        element={<FollowUps />}
                    />

                    <Route
                        path="/followups/add"
                        element={<AddFollowUp />}
                    />

                    <Route
                        path="/followups/edit/:id"
                        element={<EditFollowUp />}
                    />

                    <Route
                        path="/followups/:id"
                        element={<FollowUpDetails />}
                    />
                    <Route
                         path="/customers/convert/:id"
                        element={<ConvertCustomer />}
                    />
                    
                    <Route
                    path="/employees"
                    element={<Employees />}
                    />
                    <Route
                    path="/employees/add"
                    element={<AddEmployee />}
                    />
                    <Route
                    path="/employees/edit/:id"
                    element={<EditEmployee />}
                    />
                    <Route
                        path="/import-leads"
                        element={<ImportLeads />}
                    />
                   
                    


                </Route>

            </Routes>

        </BrowserRouter>

    );

}

export default App;
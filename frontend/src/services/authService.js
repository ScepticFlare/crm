import axios from "axios";

const API_URL = "https://crm-backend-bfwr.onrender.com/api";

export async function login(email, password) {

    const response = await axios.post(

        API_URL + "/auth/login",

        {
            email,
            password
        }

    );

    return response.data;
}
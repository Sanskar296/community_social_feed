// context/AuthContext.jsx
import { createContext, useState, useEffect } from "react";
import ApiService from "../services/api"; // Fix: Changed from ApiService to api

export const AuthContext = createContext(null); // Initialize with null

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
    const [loading, setLoading] = useState(!user);

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    ApiService.setAuthToken(token);
                    const response = await ApiService.getCurrentUser();
                    setUser(response.data);
                    localStorage.setItem("user", JSON.stringify(response.data));
                }
            } catch (error) {
                console.error("Auth verification error:", error);
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                ApiService.setAuthToken(null);
            } finally {
                setLoading(false);
            }
        };

        if (!user) verifyAuth();
    }, []);

    // Add development bypass check
    useEffect(() => {
        const devBypass = localStorage.getItem("dev_bypass_key");
        if (devBypass === "vit_dev_2023") {
            // Set a temporary development user
            const devUser = {
                _id: "dev_user",
                username: "developer",
                role: "admin",
                // Add any other user properties needed
            };
            setUser(devUser);
            localStorage.setItem("user", JSON.stringify(devUser));
        }
    }, []);

    const login = async (credentials) => {
        // Simple dev bypass
        if (credentials.username === "dev" && credentials.password === "dev123") {
            const devUser = {
                _id: "dev_user",
                username: "developer",
                role: "admin",
                firstname: "Dev",
                lastname: "User"
            };
            localStorage.setItem("dev_key", "dev123");
            localStorage.setItem("user", JSON.stringify(devUser));
            setUser(devUser);
            return { success: true };
        }

        try {
            const response = await ApiService.login(credentials);
            const { token, user } = response;
            if (!token || !user) {
                throw new Error("Invalid response from server");
            }
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));
            ApiService.setAuthToken(token);
            setUser(user);
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return { 
                success: false, 
                message: error.message || "Login failed"
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user"); // Add this line
        ApiService.setAuthToken(null); // Remove the token on logout
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
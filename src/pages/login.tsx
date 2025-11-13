import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    companySlug: "",
    email: "",
    password: "",
  });

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Handle login/register
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ✅ Use local proxy for CORS-free requests
     const endpoint = isLogin
  ? "/api/v1/auth/login"
  : "/api/v1/auth/register";


      const body = isLogin
        ? {
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
            firstName: form.firstName,
            lastName: form.lastName,
            companyName: form.companyName,
            companySlug: form.companySlug,
          };

      console.log("📡 Sending request to:", endpoint);
      console.log("📦 Body:", body);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      console.log("✅ Response:", data);

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          data?.detail?.[0]?.msg ||
          "Invalid credentials or input data";
        toast.error(errorMsg);
        console.error("❌ API Error:", data);
        return;
      }

      // ✅ Handle Login
      if (isLogin) {
        const token =
          data?.token ||
          data?.access_token ||
          data?.user?.token ||
          data?.data?.token;

        if (token) {
          localStorage.setItem("token", token);
          toast.success("Login successful!");
          navigate("/dashboard");
        } else {
          toast.error("No token received from server.");
        }
      }

      // ✅ Handle Registration
      else {
        toast.success("Registration successful! Please verify your email.");
        setIsLogin(true);
        setForm({
          firstName: "",
          lastName: "",
          companyName: "",
          companySlug: "",
          email: "",
          password: "",
        });
      }
    } catch (error) {
      console.error("❌ Network Error:", error);
      toast.error("Unable to connect to server. Check your internet or proxy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md shadow-md border">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">
            {isLogin ? "Login" : "Register"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ✅ Registration fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    First Name
                  </label>
                  <Input
                    type="text"
                    name="firstName"
                    placeholder="Enter your first name"
                    value={form.firstName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    name="lastName"
                    placeholder="Enter your last name"
                    value={form.lastName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Company Name
                  </label>
                  <Input
                    type="text"
                    name="companyName"
                    placeholder="Enter company name"
                    value={form.companyName}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Company Slug
                  </label>
                  <Input
                    type="text"
                    name="companySlug"
                    placeholder="Enter company slug (e.g., my-company)"
                    value={form.companySlug}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              </>
            )}

            {/* ✅ Email */}
            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            {/* ✅ Password */}
            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <Input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            {/* ✅ Submit Button */}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>

          {/* ✅ Switch between Login & Register */}
          <div className="text-center mt-4 text-sm text-gray-600">
            {isLogin ? (
              <>
                Don’t have an account?{" "}
                <span
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => setIsLogin(false)}
                >
                  Register
                </span>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <span
                  className="text-blue-600 cursor-pointer hover:underline"
                  onClick={() => setIsLogin(true)}
                >
                  Login
                </span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

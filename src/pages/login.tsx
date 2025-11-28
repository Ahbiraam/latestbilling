import { useState, useContext, ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiFetch, setTokens } from "@/lib/api";
import { AuthContext } from "@/context/AuthContext";


interface FormState {
  firstName: string;
  lastName: string;
  companyName: string;
  companySlug: string;
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);

  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    companyName: "",
    companySlug: "",
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      const resp = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });

      const data = await resp.json();

      // ==========================================
      // ERROR HANDLING — FIXED
      // ==========================================
      if (!resp.ok) {
        let errMsg = "Invalid email or password";

        if (data?.message) errMsg = data.message;
        if (data?.error) errMsg = data.error;
        if (Array.isArray(data?.detail)) errMsg = data.detail.join(", ");
        if (typeof data?.detail === "string") errMsg = data.detail;

        toast.error(errMsg);
        return;
      }

      // ==========================================
     
  // LOGIN SUCCESS
if (isLogin) {
  const accessToken = data?.tokens?.accessToken;
  const refreshToken = data?.tokens?.refreshToken;

  if (!accessToken) {
    toast.error("No access token returned by server");
    return;
  }

  setTokens({
    access_token: accessToken,
    refresh_token: refreshToken || null,
  });

  login({ access_token: accessToken });

  toast.success("Login successful!");
  navigate("/dashboard");
}


      // ==========================================
      // REGISTER SUCCESS
      // ==========================================
      else {
        toast.success("Registration successful!");
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

    } catch (err: any) {
      toast.error(err.message || "Network error");
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

            {!isLogin && (
              <>
                <div>
                  <label className="block mb-1 text-sm font-medium">First Name</label>
                  <Input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Last Name</label>
                  <Input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Company Name</label>
                  <Input
                    name="companyName"
                    value={form.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="block mb-1 text-sm font-medium">Company Slug</label>
                  <Input
                    name="companySlug"
                    value={form.companySlug}
                    onChange={handleChange}
                    required
                  />
                </div>
              </>
            )}

            <div>
              <label className="block mb-1 text-sm font-medium">Email</label>
              <Input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm font-medium">Password</label>
              <Input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLogin ? "Login" : "Register"}
            </Button>
          </form>

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

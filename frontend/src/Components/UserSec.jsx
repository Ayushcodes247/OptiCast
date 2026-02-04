import { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

const UserSec = ({ children }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading } = useSelector((state) => state.login);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/users/profile`,
          { withCredentials: true },
        );

        dispatch({
          type: "USER_PROFILE_SUCCESS",
          payload: { user: data.user },
        });
      } catch (error) {
        console.error("Profile fetch failed:", error.message);
        navigate("/login");
      }
    };

    if (!user) {
      fetchProfile();
    }
  }, [user, navigate, dispatch]);

  if (loading) return <h1>LOADING</h1>;

  return <>{children}</>;
};

export default UserSec;

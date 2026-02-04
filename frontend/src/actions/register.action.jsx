import axios from "axios";

export const registerAction = (userdet) => async (dispatch) => {
  try {
    dispatch({ type: "USER_REGISTER_REQUEST" });

    const config = {
      headers: {
        "Content-type": "application/json",
      },
      withCredentials: true,
    };

    const { data, status } = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/users/register`,
      userdet,
      config,
    );

    if (status === 201 && data.user) {
      localStorage.setItem("OptiUser", JSON.stringify(data.user));

      const expiresIn = 24 * 60 * 60;
      const expiryTime = new Date().getTime() + expiresIn * 1000;
      localStorage.setItem("SessionExpiry", expiryTime);

      setTimeout(() => {
        localStorage.removeItem("OptiUser");
        localStorage.removeItem("SessionExpiry");

        window.location.href = "/login";
      }, expiresIn * 1000);

      dispatch({
        type: "USER_REGISTER_SUCCESS",
        payload: { user: data.user },
      });

      return { user: data.user };
    } else {
      throw new Error("Registration failed: Invalid response from the server");
    }
  } catch (error) {
    console.error("[Action's] Error in register:", error.message);
    dispatch({
      type: "USER_REGISTER_FAIL",
      payload: error.response?.data?.message || error.message,
    });
  }
};

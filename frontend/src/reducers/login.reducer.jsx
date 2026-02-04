const initialState = {
  user: localStorage.getItem("OptiUser")
    ? JSON.parse(localStorage.getItem("OptiUser"))
    : null,
  loading: false,
  error: false,
};

export const loginReducer = (state = initialState, action) => {
  switch (action.type) {
    case "USER_LOGIN_REQUEST":
      return { ...state, loading: true, error: false };

    case "USER_PROFILE_SUCCESS":
      return {
        ...state,
        loading: false,
        user: action.payload.user,
        error: false,
      };

    case "USER_LOGIN_FAIL":
      return { ...state, loading: false, error: action.payload };

    default:
      return state;
  }
};

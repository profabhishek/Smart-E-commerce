import axios from "axios";
export default axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://coreex-env.eba-mfhecmbg.ap-south-1.elasticbeanstalk.com",
});

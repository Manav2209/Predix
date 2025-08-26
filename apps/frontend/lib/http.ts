import axios from "axios";
import { API_URL } from "./config";
import { TDepth } from "./types";

export const getDepth = async (eventId: string): Promise<TDepth> => {
  const response = await axios.get(`${API_URL}/depth/${eventId}`);
  return response.data.data.payload.depth;
};
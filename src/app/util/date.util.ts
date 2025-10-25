import dayjs from "dayjs";
import { DEFAULT_NODE_DATE_FORMAT } from "./constants";

export const convertToNodeDateFormat = (dateString: string): string => {
  return dayjs(dateString).format(DEFAULT_NODE_DATE_FORMAT);
};
import apiService from "@/lib/apiService";
import { User } from "@/types/user";

const BASE_URL = "/users";

export const userService = {
    getAllUsers: async () => {
        // According to user request: http://localhost:8080/api/v1/users
        // apiService base URL is likely /api/v1
        return apiService.get<User[]>(`${BASE_URL}`);
    },
};

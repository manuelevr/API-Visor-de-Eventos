import { User } from "./User";

export 
interface LogedUsersType {
  [key: string]: User; // Esto indica que las claves serán strings y los valores serán objetos de tipo User
}
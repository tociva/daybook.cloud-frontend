export interface MenuNode {
  path: string;
  name: string;
  icon?: string;
  children?: MenuNode[];
}
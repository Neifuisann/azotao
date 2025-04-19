import {
  Tag,
  Bookmark,
  LayoutGrid,
  LucideIcon,
  FileText,
  ShoppingBag,
  HelpCircle
} from "lucide-react";
import { AuthUser } from "./api"; // Assuming AuthUser interface is here or imported

type Submenu = {
  href: string;
  label: string;
  active?: boolean;
};

type Menu = {
  href: string;
  label: string;
  active?: boolean;
  icon: LucideIcon;
  submenus?: Submenu[];
};

type Group = {
  groupLabel: string;
  menus: Menu[];
};

export function getMenuList(pathname: string, role?: AuthUser['role']): Group[] {
  // Define the full menu structure
  const allMenus: Menu[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      submenus: []
    },
    {
      href: "/testbank",
      label: "Test Bank",
      icon: FileText
    },
    {
      href: "/document-market",
      label: "Document Market",
      icon: ShoppingBag
    },
    {
      href: "/question-bank",
      label: "Question Bank",
      icon: HelpCircle
    },
    {
      href: "/categories",
      label: "Categories",
      icon: Bookmark
    },
    {
      href: "/tags",
      label: "Tags",
      icon: Tag
    }
  ];

  // Filter menus based on role
  let filteredMenus: Menu[];
  if (role === 'student') {
    // Students only see the Dashboard link
    filteredMenus = allMenus.filter(menu => menu.href === '/dashboard');
  } else {
    // Teachers (or default/undefined role) see all menus
    filteredMenus = allMenus;
  }

  // Return the menu structure with filtered menus
  return [
    {
      groupLabel: "", // Keep groupLabel empty if not needed
      menus: filteredMenus
    }
  ];
}

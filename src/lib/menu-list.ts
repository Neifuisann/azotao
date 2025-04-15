import {
  Tag,
  Bookmark,
  LayoutGrid,
  LucideIcon,
  FileText,
  ShoppingBag,
  HelpCircle
} from "lucide-react";

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

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupLabel: "",
      menus: [
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
      ]
    }
  ];
}

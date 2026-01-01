import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SIDEBAR, type SidebarItem } from "@/constants/sidebar";

interface PaginationProps {
  currentPath: string;
}

interface PaginationLinks {
  prev: SidebarItem | undefined;
  next: SidebarItem | undefined;
}

function getPaginationLinks(currentPath: string): PaginationLinks {
  let currentSectionIndex: number | undefined;
  let currentItemIndex: number | undefined;

  SIDEBAR.forEach((section, sectionIdx) => {
    const itemIdx = section.items.findIndex((item) => item.href === currentPath);
    if (itemIdx !== -1) {
      currentSectionIndex = sectionIdx;
      currentItemIndex = itemIdx;
    }
  });

  if (currentSectionIndex === undefined || currentItemIndex === undefined) {
    return { prev: undefined, next: undefined };
  }

  const currentSection = SIDEBAR[currentSectionIndex];
  let prev: SidebarItem | undefined;
  let next: SidebarItem | undefined;

  if (currentItemIndex > 0) {
    prev = currentSection.items[currentItemIndex - 1];
  } else if (currentSectionIndex > 0) {
    const prevSection = SIDEBAR[currentSectionIndex - 1];
    prev = prevSection.items[prevSection.items.length - 1];
  }

  if (currentItemIndex < currentSection.items.length - 1) {
    next = currentSection.items[currentItemIndex + 1];
  } else if (currentSectionIndex < SIDEBAR.length - 1) {
    next = SIDEBAR[currentSectionIndex + 1].items[0];
  }

  return { prev, next };
}

export function Pagination({ currentPath }: PaginationProps) {
  const { prev, next } = getPaginationLinks(currentPath);

  return (
    <div className="flex gap-7">
      {prev && <PaginationButton direction="prev" item={prev} />}
      {next && <PaginationButton direction="next" item={next} />}
    </div>
  );
}

function PaginationButton({ direction, item }: { direction: "prev" | "next"; item: SidebarItem }) {
  const isPrev = direction === "prev";
  const containerClass = isPrev ? "mr-auto" : "ml-auto";

  return (
    <Link to={item.href} className={`${containerClass} flex`}>
      <button className="btn rounded-full">
        {isPrev && <ChevronLeft className="h-6 w-6" />}
        <span className="text-xs md:text-sm font-medium">{item.title}</span>
        {!isPrev && <ChevronRight className="h-6 w-6" />}
      </button>
    </Link>
  );
}

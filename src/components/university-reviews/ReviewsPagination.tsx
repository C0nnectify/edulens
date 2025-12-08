
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";

type Props = {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPage: (p: number) => void;
  getPageNumbers: () => number[];
};

export default function ReviewsPagination({
  page,
  totalPages,
  onPrev,
  onNext,
  onPage,
  getPageNumbers,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center my-8">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={onPrev}
              aria-disabled={page === 1}
              className={page === 1 ? "pointer-events-none opacity-50" : ""}
              tabIndex={page === 1 ? -1 : 0}
              href="#"
            />
          </PaginationItem>
          {getPageNumbers().map((pg, idx) => (
            <PaginationItem key={pg}>
              {idx > 0 && pg - getPageNumbers()[idx - 1] > 1 ? (
                <span className="px-2 text-gray-400">…</span>
              ) : null}
              <PaginationLink
                isActive={pg === page}
                onClick={() => onPage(pg)}
                href="#"
              >
                {pg}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              onClick={onNext}
              aria-disabled={page === totalPages}
              className={page === totalPages ? "pointer-events-none opacity-50" : ""}
              tabIndex={page === totalPages ? -1 : 0}
              href="#"
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}

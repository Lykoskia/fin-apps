import 'jspdf';
import { UserOptions, Column, Row } from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: UserOptions) => void;
    lastAutoTable: {
      id?: string;
      table: {
        id?: string;
        head: Row[];
        body: Row[];
        foot: Row[];
        x: number;
        y: number;
        width: number;
        height: number;
        initialPageNumber: number;
        finalY: number;
        pageNumber: number;
        settings: UserOptions;
        columns: Column[];
      };
      finalY: number;
      settings: UserOptions;
    };
  }
}
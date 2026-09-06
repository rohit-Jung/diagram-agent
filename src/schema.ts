export enum FillStyle {
  Solid = "solid",
  Hachure = "hachure",
  CrossHatch = "cross-hatch",
}
export type FillStyleType = `${FillStyle}`;

export enum TextAlign {
  Left = "left",
  Center = "center",
  Right = "right",
}
export type TextAlignType = `${TextAlign}`;

export enum VerticalAlign {
  Top = "top",
  Middle = "middle",
  Bottom = "bottom",
}
export type VerticalAlignType = `${VerticalAlign}`;

export interface BaseElement {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  strokeColor: string;
  backgroundColor: string;
  fillStyle: FillStyleType;
  strokeWidth: number;
  roughness: number;
  opacity: number;
  angle: number;
  groupIds: string[];
  isDeleted: boolean;
  boundElements: { id: string; type: "arrow" | "text" }[] | null;
}

export enum Diagram {
  Rectangle = "rectangle",
  Diamond = "diamond",
  Ellipse = "ellipse",
  Arrow = "arrow",
  Line = "line",
  Text = "text",
}

export type DiagramType = `${Diagram}`;

export interface RectangleElement extends BaseElement {
  type: Diagram.Rectangle;
  roundness: { type: number; value?: number } | null;
}

export interface EllipseElement extends BaseElement {
  type: Diagram.Ellipse;
}

export interface DiamondElement extends BaseElement {
  type: Diagram.Diamond;
}

export interface TextElement extends BaseElement {
  type: Diagram.Text;
  text: string;
  fontSize: number;
  fontFamily: number;
  textAlign: TextAlignType;
  verticalAlign: VerticalAlignType;
  containerId: string | null;
}

export interface ArrowElement extends BaseElement {
  type: Diagram.Arrow;
  points: [number, number][];
  startBinding: { elementId: string; focus: number; gap: number } | null;
  endBinding: { elementId: string; focus: number; gap: number } | null;
}

export interface LineElement extends BaseElement {
  type: Diagram.Line;
  points: [number, number][];
}

export type ExcaliDrawElements =
  | RectangleElement
  | EllipseElement
  | DiamondElement
  | TextElement
  | ArrowElement
  | LineElement;

// Typed access to the design system components (see docs/design-system/README.md for when to use which).
import type * as T from "./types";
import type { ReactElement } from "react";
import * as SH from "./components";

type C<P> = (props: P) => ReactElement;

export const Accordion = SH.Accordion as C<T.AccordionProps>;
export const Alert = SH.Alert as C<T.AlertProps>;
export const Badge = SH.Badge as C<T.BadgeProps>;
export const Breadcrumbs = SH.Breadcrumbs as C<T.BreadcrumbsProps>;
// the port adds the form attributes the shipped .d.ts leaves out (server-rendered forms need name/value/formAction)
type FormAttrs = { name?: string; value?: string; formAction?: string | ((fd: FormData) => void | Promise<void>); formNoValidate?: boolean; download?: boolean; target?: string; rel?: string; ariaLabel?: string };
export const Button = SH.Button as C<T.ButtonProps & FormAttrs & { type?: "button" | "submit"; className?: string }>;
export const CartItem = SH.CartItem as C<T.CartItemProps>;
export const Checkbox = SH.Checkbox as C<T.CheckboxProps & { id?: string; name?: string; value?: string; required?: boolean; invalid?: boolean; className?: string }>;
export const Chip = SH.Chip as C<T.ChipProps>;
export const Container = SH.Container as C<T.ContainerProps>;
export const DataTable = SH.DataTable as C<T.DataTableProps>;
export const DateStrip = SH.DateStrip as C<T.DateStripProps>;
export const EmptyState = SH.EmptyState as C<T.EmptyStateProps>;
export const FactTile = SH.FactTile as C<T.FactTileProps>;
export const Footer = SH.Footer as C<T.FooterProps>;
export const GaugeBar = SH.GaugeBar as C<T.GaugeBarProps>;
// the bundle also reads these props; the shipped .d.ts lists fewer
export const Header = SH.Header as C<T.HeaderProps & { homeHref?: string; brandLabel?: string; cartLabel?: string; navLabel?: string; className?: string }>;
export const Icon = SH.Icon as C<T.IconProps>;
export const IconButton = SH.IconButton as C<T.IconButtonProps>;
export const Input = SH.Input as C<T.InputProps>;
export const OrderSummary = SH.OrderSummary as C<T.OrderSummaryProps>;
export const PlantCard = SH.PlantCard as C<T.PlantCardProps>;
export const PlantHero = SH.PlantHero as C<T.PlantHeroProps>;
export const PotIllustration = SH.PotIllustration as C<T.PotIllustrationProps>;
export const Price = SH.Price as C<T.PriceProps>;
export const ProductCard = SH.ProductCard as C<T.ProductCardProps>;
export const ProgressBar = SH.ProgressBar as C<T.ProgressBarProps>;
export const QrLabel = SH.QrLabel as C<T.QrLabelProps>;
export const QuantityStepper = SH.QuantityStepper as C<T.QuantityStepperProps>;
export const RadioCard = SH.RadioCard as C<T.RadioCardProps & { required?: boolean; defaultChecked?: boolean; className?: string }>;
export const Rating = SH.Rating as C<T.RatingProps>;
export const ReviewCard = SH.ReviewCard as C<T.ReviewCardProps>;
export const ScanFrame = SH.ScanFrame as C<T.ScanFrameProps>;
export const SearchField = SH.SearchField as C<T.SearchFieldProps>;
export const Section = SH.Section as C<T.SectionProps>;
export const SegmentedControl = SH.SegmentedControl as C<T.SegmentedControlProps>;
export const Select = SH.Select as C<T.SelectProps & { id?: string; name?: string; required?: boolean; disabled?: boolean; defaultValue?: string; ariaLabel?: string }>;
export const Sheet = SH.Sheet as C<T.SheetProps>;
export const Skeleton = SH.Skeleton as C<T.SkeletonProps>;
export const StatTile = SH.StatTile as C<T.StatTileProps>;
export const Steps = SH.Steps as C<T.StepsProps>;
export const Switch = SH.Switch as C<T.SwitchProps & { name?: string; value?: string }>;
export const TabBar = SH.TabBar as C<T.TabBarProps & { label?: string }>;
export const TaskCard = SH.TaskCard as C<T.TaskCardProps>;
export const Timeline = SH.Timeline as C<T.TimelineProps>;
export const Toast = SH.Toast as C<T.ToastProps>;
export const Grid = SH.Grid as C<Omit<T.GridProps, "cols"> & { cols?: T.GridProps["cols"] | "steps" }>;
export const Split = SH.Split as C<T.SplitProps>;
export const AppBar = SH.AppBar as C<T.AppBarProps>;
export const WeatherCard = SH.WeatherCard as C<T.WeatherCardProps>;
export const Combobox = SH.Combobox as C<T.ComboboxProps & { id?: string }>;
export const Lightbox = SH.Lightbox as C<T.LightboxProps>;
export const BarChart = SH.BarChart as C<T.BarChartProps>;
export const Dots = SH.Dots as C<T.DotsProps>;

export type * from "./types";

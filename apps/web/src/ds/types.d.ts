export interface AccordionProps { title: string; open?: boolean; children?: any }
export interface AlertProps { tone?: 'info'|'success'|'warning'|'danger'; title?: string; children?: any }
export interface BadgeProps { tone?: 'leaf'|'neutral'|'accent'|'info'|'success'|'warning'|'danger'; icon?: string; children?: any }
export interface BreadcrumbsProps { items: {label: string; href?: string}[] }
export interface ButtonProps { variant?: 'primary'|'accent'|'action'|'secondary'|'ghost'|'danger'; size?: 'sm'|'md'|'lg'; icon?: string; iconRight?: string; full?: boolean; loading?: boolean; href?: string; onClick?: () => void; disabled?: boolean; children?: any }
export interface CartItemProps { title: string; subtitle?: string; image?: any; price: string; qty: number; onQty: (n: number) => void; onRemove?: () => void; href?: string; removeLabel?: string }
export interface CheckboxProps { checked?: boolean; defaultChecked?: boolean; onChange?: (e: any) => void; disabled?: boolean; children?: any }
export interface ChipProps { selected?: boolean; icon?: string; count?: number; href?: string; onClick?: () => void; children?: any }
export interface ContainerProps { narrow?: boolean; as?: string; children?: any }
export interface DataTableProps { columns: {key: string; label: string; align?: 'right'}[]; rows: Record<string, any>[]; caption?: string; mode?: 'auto'|'mobile'|'desktop' }
export interface DateStripProps { days: {key?: string; day: string; date: string; selected?: boolean}[]; onSelect?: (d: any) => void }
export interface EmptyStateProps { icon?: string; title: string; text?: string; action?: any }
export interface FactTileProps { icon: string; label: string; value: string; tone?: string }
export interface FooterProps { brand: string; about?: string; helpTitle?: string; links?: {label: string; href?: string}[]; note?: string }
export interface GaugeBarProps { value: number; display?: string; label?: string; horizontal?: boolean; caption?: string }
export interface HeaderProps { brand: string; items?: {label: string; href?: string; current?: boolean}[]; end?: any; cartCount?: number; cartHref?: string; onCart?: () => void; mode?: 'auto'|'mobile'|'desktop' }
export interface IconProps { name: string; size?: number; title?: string; strokeWidth?: number; fill?: string }
export interface IconButtonProps { icon: string; label: string; variant?: 'solid'|'lime'|'deep'|'ghost'; size?: 'sm'|'md'|'lg'; badge?: number|string; pressed?: boolean; href?: string; onClick?: () => void }
export interface InputProps { label?: string; hint?: string; error?: string; icon?: string; multiline?: boolean; [htmlAttr: string]: any }
export interface OrderSummaryProps { title?: string; rows: {label: string; value: string}[]; note?: string; totalLabel?: string; total: string; cta?: any }
export interface PlantCardProps { name: string; latin?: string; badges?: {label: string; tone?: string; icon?: string}[]; image?: any; stats?: {value: string; label: string}[]; href?: string; arrow?: boolean; tone?: 'card'|'sage'|'sand'|'sky'|'soft' }
export interface PlantHeroProps { name: string; latin?: string; tagline?: string; badges?: {label: string; tone?: string; icon?: string}[]; image?: any; price?: string; priceNote?: string; actions?: any; theme?: 'garden'; children?: any }
export interface PotIllustrationProps { color?: string; glaze?: 'sage'|'cream'|'terracotta'; label?: string; bg?: boolean; qr?: boolean }
export interface PriceProps { amount: string; note?: string; size?: 'lg' }
export interface ProductCardProps { title: string; subtitle?: string; image?: any; price: string; priceNote?: string; rating?: number; ratingCount?: number; href?: string; onAdd?: () => void; tone?: 'card'|'sage'|'sand'|'sky'|'soft' }
export interface ProgressBarProps { value: number; label?: string }
export interface QrLabelProps { code: string; name?: string; qr?: any }
export interface QuantityStepperProps { value: number; onChange: (n: number) => void; min?: number; max?: number; label?: string }
export interface RadioCardProps { name: string; value: string; title: string; description?: string; icon?: string; right?: string; checked?: boolean; onChange?: (e: any) => void }
export interface RatingProps { value: number; count?: number }
export interface ReviewCardProps { rating: number; text: string; author: string; meta?: string }
export interface ScanFrameProps { hint?: string; children?: any }
export interface SearchFieldProps { placeholder?: string; value?: string; onChange?: (e: any) => void; onSubmit?: () => void; onFilter?: () => void; filterLabel?: string }
export interface SectionProps { title?: string; lead?: string; hero?: boolean; theme?: 'garden'; as?: string; children?: any }
export interface SegmentedControlProps { options: {value: string; label: string}[]; value: string; onChange?: (v: string) => void; label?: string }
export interface SelectProps { label?: string; options: {value: string; label: string}[]; value?: string; onChange?: (e: any) => void }
export interface SheetProps { open: boolean; onClose?: () => void; title: string; closeLabel?: string; mode?: 'auto'|'mobile'|'desktop'; children?: any }
export interface SkeletonProps { w?: string|number; h?: string|number; round?: boolean }
export interface StatTileProps { label: string; value: string; delta?: string; deltaTone?: 'success'|'warning'|'danger'|'info'; icon?: string }
export interface StepsProps { steps: string[]; current: number; label?: string }
export interface SwitchProps { checked?: boolean; defaultChecked?: boolean; onChange?: (e: any) => void; children?: any }
export interface TabBarProps { items: {label: string; icon: string; href?: string; current?: boolean; badge?: number}[]; mode?: 'auto'|'mobile'|'desktop' }
export interface TaskCardProps { title: string; subtitle?: string; progress?: number; tone?: 'sky'|'sand'|'sage'|'card'; illustration?: any; done?: boolean }
export interface TimelineProps { events: {title: string; time?: string; done?: boolean; current?: boolean}[] }
export interface ToastProps { tone?: 'info'|'success'|'warning'|'danger'; action?: string; onAction?: () => void; children?: any }
export interface GridProps { cols?: 'cards'|'facts'|'stats'|'two'; list?: boolean; children?: any }
export interface SplitProps { aside?: any; reverse?: boolean; children?: any }
export interface AppBarProps { title: string; eyebrow?: string; left?: any; right?: any }
export interface WeatherCardProps { condition: string; temp: string; range?: string; art?: any; action?: any }
export interface ComboboxProps { label?: string; placeholder?: string; icon?: string; value?: string; defaultValue?: string; open?: boolean; options: {value: string; label: string; hint?: string}[]; selected?: string; onChange?: (e: any) => void; onSelect?: (o: any) => void; emptyText?: string }
export interface LightboxProps { open: boolean; onClose?: () => void; onPrev?: () => void; onNext?: () => void; caption?: string; closeLabel?: string; prevLabel?: string; nextLabel?: string; children?: any }
export interface BarChartProps { data: {label: string; value: number}[]; title?: string; height?: number }
export interface DotsProps { count: number; current: number }

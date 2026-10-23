import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  CloudUpload,
  Eye,
  FileText,
  ListTodo,
  Paperclip,
  Plus,
  RotateCw,
  Trash2,
  X,
} from "lucide-react"

import { completeTask, createTask, deleteTask, getTaskCategories, getTasks } from "@/api/tasks/tasks"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import {
  Attachment,
  AttachmentAction,
  AttachmentContent,
  AttachmentMedia,
} from "@/components/ui/attachment"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const PAGE_SIZE = 10
const ALL_CATEGORIES = "__all_task_categories__"
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
const COMMON_CATEGORIES = ["Bills", "Banking", "Insurance", "Tax"]
const TASK_STATUSES = {
  in_progress: { label: "In progress", variant: "outline" },
  Completed: { label: "Completed", variant: "secondary" },
  Overdue: { label: "Overdue", variant: "destructive" },
}

function formatDate(value) {
  if (!value) return "No due date"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "No due date"
    : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date)
}

function getRelativeDueDate(value, unit) {
  const amount = Number(value)
  if (!Number.isInteger(amount) || amount < 1 || !unit) return null

  const dueDate = new Date()
  if (unit === "hours") dueDate.setHours(dueDate.getHours() + amount)
  if (unit === "days") dueDate.setDate(dueDate.getDate() + amount)
  if (unit === "months") dueDate.setMonth(dueDate.getMonth() + amount)
  return dueDate
}

function fileIsImage(url = "") {
  try {
    return /\.(jpe?g|png|gif)$/i.test(new URL(url).pathname)
  } catch {
    return /\.(jpe?g|png|gif)(?:$|\?)/i.test(url)
  }
}

function TaskFormDialog({ open, onOpenChange, onCreate, categories }) {
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [category, setCategory] = useState("")
  const [dateValue, setDateValue] = useState("")
  const [dueDateUnit, setDueDateUnit] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [formError, setFormError] = useState("")
  const [attachmentError, setAttachmentError] = useState("")
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef(null)
  const taskNameInputRef = useRef(null)
  const formContentRef = useRef(null)

  useEffect(() => {
    const previewUrl = attachment?.previewUrl
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [attachment])

  function chooseFile(file) {
    if (!file) return
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setAttachmentError("Choose a JPG, PNG, GIF, or PDF file.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setAttachmentError("The attachment must be 5 MB or smaller.")
      return
    }
    setAttachmentError("")
    setAttachment({
      file,
      previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
    })
    taskNameInputRef.current?.focus({ preventScroll: true })
    formContentRef.current?.scrollTo({ top: 0 })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = taskName.trim()
    const cleanDescription = taskDescription.trim()
    const cleanCategory = category.trim()

    if (!cleanName) {
      setFormError("Enter a task name.")
      return
    }
    if ((dateValue && !dueDateUnit) || (!dateValue && dueDateUnit)) {
      setFormError("Enter both the amount of time and its unit, or leave both blank.")
      return
    }
    if (dateValue && (!Number.isInteger(Number(dateValue)) || Number(dateValue) < 1)) {
      setFormError("Enter a whole number of at least 1 for the due date.")
      return
    }

    setSaving(true)
    setFormError("")
    try {
      await onCreate({
        taskName: cleanName,
        taskDescription: cleanDescription,
        ...(cleanCategory ? { category: cleanCategory } : {}),
        ...(dateValue && dueDateUnit ? { dateValue, dueDateUnit } : {}),
        ...(attachment ? { document: attachment.file } : {}),
      })
      onOpenChange(false)
    } catch (submitError) {
      setFormError(submitError.message || "We couldn’t create this task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="task-dialog-scroll flex max-h-[90dvh] flex-col overflow-hidden p-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a financial task</DialogTitle>
          <DialogDescription className="text-foreground/75">
            Keep a money-related action organized. A due date and attachment are both optional.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={formContentRef} className="task-dialog-scroll min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-1 pb-4 pt-1">
            <div className="space-y-2">
              <Label htmlFor="task-name" className="font-sans">Task name</Label>
              <Input
                id="task-name"
                ref={taskNameInputRef}
                autoFocus
                maxLength={120}
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                placeholder="e.g. Review my monthly bank statement"
                className="border-foreground/20 placeholder:text-foreground/70"
              />
            </div>
            <section className="space-y-3 rounded-xl border border-foreground/20 bg-muted/25 p-4" aria-labelledby="task-description-heading">
              <div>
                <h3 id="task-description-heading" className="font-sans text-sm font-medium">Description <span className="font-normal text-foreground/75">(optional)</span></h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/75">Add a note if more context would be useful.</p>
              </div>
              <Textarea
                id="task-description"
                maxLength={1000}
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                placeholder="Add details if they’d be helpful."
                className="min-h-20 border-foreground/20 placeholder:text-foreground/70"
              />
            </section>

            <section className="space-y-3 rounded-xl border border-foreground/20 bg-muted/25 p-4" aria-labelledby="task-category-heading">
              <div>
                <h3 id="task-category-heading" className="font-sans text-sm font-medium">Category <span className="font-normal text-foreground/75">(optional)</span></h3>
                <p className="mt-1 text-xs leading-relaxed text-foreground/75">Choose a suggestion or type a category of your own.</p>
              </div>
              <Input
                id="task-category"
                list="task-category-options"
                maxLength={60}
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder="Choose or enter a category"
                className="border-foreground/20 placeholder:text-foreground/70"
                aria-label="Optional task category"
              />
              <datalist id="task-category-options">
                {categories.map((item) => <option key={item} value={item} />)}
              </datalist>
            </section>

            <section className="space-y-3 rounded-xl border border-foreground/20 bg-muted/25 p-4" aria-labelledby="task-deadline-heading">
              <div className="flex items-start gap-3">
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 id="task-deadline-heading" className="font-sans text-sm font-medium">Due date <span className="font-normal text-foreground/75">(optional)</span></h3>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/75">Set a time from now, or leave both fields empty for no deadline.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="task-date-value" className="font-sans text-xs text-foreground/80">Due in</Label>
                  <Input
                    id="task-date-value"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={dateValue}
                    onChange={(event) => setDateValue(event.target.value)}
                    placeholder="Enter a number"
                    className="border-foreground/20 placeholder:text-foreground/70"
                    aria-label="Amount of time until task is due"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-date-unit" className="font-sans text-xs text-foreground/80">Time unit</Label>
                  <select
                    id="task-date-unit"
                    value={dueDateUnit}
                    onChange={(event) => setDueDateUnit(event.target.value)}
                    className="flex h-9 w-full rounded-lg border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    aria-label="Unit of time until task is due"
                  >
                    <option value="" disabled>Select a unit</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2" aria-label="Quick due date choices">
                {[
                  { label: "Today", value: "1", unit: "hours" },
                  { label: "Tomorrow", value: "1", unit: "days" },
                  { label: "Next week", value: "7", unit: "days" },
                ].map(({ label, value, unit }) => {
                  const isSelected = dateValue === value && dueDateUnit === unit
                  return (
                    <Button
                      key={label}
                      type="button"
                      size="sm"
                      variant={isSelected ? "secondary" : "outline"}
                      aria-pressed={isSelected}
                      onClick={() => {
                        setDateValue(value)
                        setDueDateUnit(unit)
                      }}
                    >
                      {label}
                    </Button>
                  )
                })}
                {(dateValue || dueDateUnit) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDateValue("")
                      setDueDateUnit("")
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
              {dateValue && dueDateUnit && getRelativeDueDate(dateValue, dueDateUnit) && (
                <p className="flex items-center gap-2 text-sm text-foreground/80">
                  <Clock3 className="size-4 text-primary" aria-hidden="true" />
                  Due {formatDate(getRelativeDueDate(dateValue, dueDateUnit))}
                </p>
              )}
            </section>

            <section className="space-y-3 rounded-xl border border-foreground/20 bg-muted/25 p-4" aria-labelledby="task-attachment-heading">
              <div className="flex items-start gap-3">
                <Paperclip className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 id="task-attachment-heading" className="font-sans text-sm font-medium">Attachment <span className="font-normal text-foreground/75">(optional)</span></h3>
                  <p className="mt-1 text-xs leading-relaxed text-foreground/75">Attach a picture or PDF if it helps. JPG, PNG, GIF, or PDF · up to 5 MB.</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                id="task-document"
                type="file"
                accept="image/jpeg,image/png,image/gif,application/pdf"
                disabled={saving}
                className="peer sr-only"
                onChange={(event) => {
                  chooseFile(event.target.files?.[0])
                  event.target.value = ""
                }}
                aria-label="Choose an optional task picture or PDF"
              />
              {!attachment && (
                <label
                  htmlFor="task-document"
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDraggingFile(true)
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDraggingFile(false)
                    chooseFile(event.dataTransfer.files?.[0])
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-5 text-center transition-colors hover:bg-primary/5 peer-focus-visible:ring-2 peer-focus-visible:ring-ring ${isDraggingFile ? "border-primary bg-primary/10" : "border-foreground/30"}`}
                >
                  <CloudUpload className="size-6 text-primary" aria-hidden="true" />
                  <span className="text-sm font-medium text-foreground">
                    {isDraggingFile ? "Drop your file here" : "Drop a file or click to upload"}
                  </span>
                  <span className="text-xs text-foreground/75">Pictures or PDF · maximum 5 MB</span>
                </label>
              )}
              {attachmentError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{attachmentError}</p>}
              {attachment && (
                <Attachment className="w-full">
                  <AttachmentMedia variant={attachment.previewUrl ? "image" : "icon"} className="size-12 opacity-100">
                    {attachment.previewUrl
                      ? <img src={attachment.previewUrl} alt="" />
                      : <FileText aria-hidden="true" />}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <span className="text-sm font-medium">{attachment.previewUrl ? "Image attached" : "PDF attached"}</span>
                  </AttachmentContent>
                  <AttachmentAction
                    type="button"
                    aria-label="Remove selected attachment"
                    title="Remove attachment"
                    disabled={saving}
                    onClick={() => {
                      setAttachment(null)
                      setAttachmentError("")
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X aria-hidden="true" />
                  </AttachmentAction>
                </Attachment>
              )}
            </section>
            {formError && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{formError}</p>}
          </div>
          <DialogFooter className="mx-0 mb-0 flex-none rounded-b-xl border-t border-border bg-popover px-5 py-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              <Plus className="mr-1 size-4" aria-hidden="true" />{saving ? "Creating…" : "Create task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TaskDeleteDialog({ task, onOpenChange, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState("")

  async function handleDelete() {
    setDeleting(true)
    setError("")
    try {
      await onConfirm(task._id)
      onOpenChange(false)
    } catch (deleteError) {
      setError(deleteError.message || "We couldn’t remove this task. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => !deleting && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Move task to history?</DialogTitle>
          <DialogDescription>
            “{task.name}” will be removed from your active tasks and sent to your history.
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleting}>Keep task</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-1 size-4" aria-hidden="true" />{deleting ? "Moving…" : "Move to history"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TaskCard({ task, onView, onComplete, onDelete, busy }) {
  const status = TASK_STATUSES[task.status] ?? { label: task.status || "In progress", variant: "outline" }
  const hasImage = task.document && fileIsImage(task.document)

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-start sm:p-5">
      {task.document && (hasImage ? (
        <a
          href={task.document}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open image attachment for ${task.name}`}
          className="block w-full overflow-hidden rounded-lg border border-border sm:w-40"
        >
          <img
            src={task.document}
            alt={`Attachment for ${task.name}`}
            className="h-28 w-full object-cover"
          />
        </a>
      ) : (
        <a
          href={task.document}
          target="_blank"
          rel="noreferrer"
          className="flex w-fit items-center gap-2 self-start rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted"
        >
          <FileText className="size-4" aria-hidden="true" />
          Open attached PDF
        </a>
      ))}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="break-words text-base font-semibold">{task.name || "Untitled task"}</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        {task.description && (
          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{task.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {task.dueDate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
              <Clock3 className="size-3.5" aria-hidden="true" />
              Due {formatDate(task.dueDate)}
            </span>
          )}
          {task.category && (
            <span className="rounded-full border border-border px-2.5 py-1">{task.category}</span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View ${task.name}`}
          title={`View ${task.name}`}
          onClick={() => onView(task)}
        >
          <Eye aria-hidden="true" />
        </Button>
        {task.status === "in_progress" && (
          <Button variant="outline" size="sm" disabled={busy} title="Mark complete and move to history" onClick={() => onComplete(task)}>
            <Check className="mr-1 size-4" aria-hidden="true" />Complete
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          aria-label={`Move ${task.name} to history`}
          title="Move to history"
          disabled={busy}
          onClick={() => onDelete(task)}
        >
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
    </article>
  )
}

function TasksError({ onRetry }) {
  return (
    <Card className="border-destructive/20">
      <CardContent className="flex flex-col items-start gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
          <div>
            <p className="font-medium">We couldn’t load your tasks</p>
            <p className="mt-1 text-sm text-muted-foreground">Check your connection and try again.</p>
          </div>
        </div>
        <Button variant="outline" onClick={onRetry}><RotateCw className="mr-2 size-4" aria-hidden="true" />Try again</Button>
      </CardContent>
    </Card>
  )
}

export function FinancialTasksPage() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState([])
  const [categories, setCategories] = useState([])
  const [category, setCategory] = useState("")
  const [categoriesError, setCategoriesError] = useState("")
  const [page, setPage] = useState(1)
  const [totalTasks, setTotalTasks] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loadedRequestKey, setLoadedRequestKey] = useState(null)
  const [loadErrorKey, setLoadErrorKey] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [createOpen, setCreateOpen] = useState(false)
  const [deletingTask, setDeletingTask] = useState(null)
  const [busyTaskId, setBusyTaskId] = useState(null)
  const [actionError, setActionError] = useState("")
  const categoryOptions = useMemo(() => {
    const categoriesByKey = new Map()
    for (const item of [...COMMON_CATEGORIES, ...categories, ...tasks.map((task) => task.category)]) {
      const trimmed = item?.trim()
      if (trimmed && !categoriesByKey.has(trimmed.toLocaleLowerCase())) {
        categoriesByKey.set(trimmed.toLocaleLowerCase(), trimmed)
      }
    }
    return [...categoriesByKey.values()].sort((left, right) => left.localeCompare(right))
  }, [categories, tasks])
  const requestKey = `${category}:${page}:${reloadKey}`
  const loading = loadedRequestKey !== requestKey
  const loadError = loadErrorKey === requestKey

  useEffect(() => {
    let active = true

    getTaskCategories()
      .then((result) => {
        if (active) {
          setCategories(result)
          setCategoriesError("")
        }
      })
      .catch((error) => {
        if (active) setCategoriesError(error.message)
      })

    return () => { active = false }
  }, [reloadKey])

  useEffect(() => {
    let active = true

    getTasks({ page, limit: PAGE_SIZE, category: category || undefined })
      .then((result) => {
        if (!active) return
        if (!result.tasks.length && page > 1 && page > result.totalPages) {
          setPage(Math.max(1, result.totalPages))
          return
        }
        setTasks(result.tasks)
        setTotalTasks(result.totalDoc)
        setTotalPages(result.totalPages)
      })
      .catch(() => {
        if (active) setLoadErrorKey(requestKey)
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey)
      })

    return () => { active = false }
  }, [category, page, reloadKey, requestKey])

  async function handleCreate(values) {
    await createTask(values)
    setCategory("")
    setPage(1)
    setReloadKey((key) => key + 1)
  }

  function changeCategory(value) {
    setCategory(value === ALL_CATEGORIES ? "" : value)
    setPage(1)
  }

  async function handleComplete(task) {
    setBusyTaskId(task._id)
    setActionError("")
    try {
      await completeTask(task._id)
      setReloadKey((key) => key + 1)
    } catch (error) {
      setActionError(error.message)
    } finally {
      setBusyTaskId(null)
    }
  }

  async function handleDelete(taskId) {
    setBusyTaskId(taskId)
    setActionError("")
    try {
      await deleteTask(taskId)
      if (tasks.length === 1 && page > 1) setPage((current) => current - 1)
      else setReloadKey((key) => key + 1)
    } finally {
      setBusyTaskId(null)
    }
  }

  if (loading && !tasks.length) {
    return (
      <div className="mx-auto max-w-7xl space-y-7" aria-label="Loading tasks" aria-busy="true">
        <header className="space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="h-10 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </header>
        <Card><CardContent className="space-y-3 p-5">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />)}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-primary">Small steps, handled</p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Financial tasks</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">Keep important money tasks, deadlines, and supporting documents in one clear list.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 size-4" aria-hidden="true" />Add task
        </Button>
      </header>

      {actionError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
          <p className="text-muted-foreground">{actionError}</p>
        </div>
      )}

      {loadError ? (
        <TasksError onRetry={() => setReloadKey((key) => key + 1)} />
      ) : totalTasks === 0 && !category ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListTodo className="size-4 text-primary" aria-hidden="true" />Your task list</CardTitle>
            <CardDescription>Add a financial task to keep your next steps visible.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmptyDataState
              icon={CheckCircle2}
              title="No financial tasks yet"
              description="Create a task to remember a bill, review, call, or other money-related action. You can add a due date or file later."
              actionLabel="Create your first task"
              actionOnClick={() => setCreateOpen(true)}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-2 border-b border-border/70 pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><ListTodo className="size-4 text-primary" aria-hidden="true" />Your task list</CardTitle>
              <CardDescription className="mt-1">
                {totalTasks} {totalTasks === 1 ? "task" : "tasks"}{category ? ` in ${category}` : " to keep on top of"}
              </CardDescription>
            </div>
            <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(190px,240px)_auto] sm:items-center">
              <Select
                value={category || ALL_CATEGORIES}
                onValueChange={changeCategory}
              >
                <SelectTrigger className="h-9 w-full" aria-label="Filter financial tasks by category">
                  <SelectValue>{category || "All categories"}</SelectValue>
                </SelectTrigger>
                <SelectContent className="p-1.5">
                  <SelectGroup>
                    <SelectLabel>Task categories</SelectLabel>
                    <SelectItem value={ALL_CATEGORIES}>All categories</SelectItem>
                    {categoryOptions.map((item) => (
                      <SelectItem key={item} value={item}>{item}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {totalPages > 1 && <p className="text-xs text-muted-foreground sm:text-right">Page {page} of {totalPages}</p>}
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            {categoriesError && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm">
                <span className="text-muted-foreground">{categoriesError}</span>
                <Button size="sm" variant="outline" onClick={() => setReloadKey((key) => key + 1)}>Retry</Button>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Deadlines and attachments are optional.                             Completing or removing a task sends it to your history.
            </div>
            <div className="space-y-3" aria-busy={loading}>
              {tasks.length === 0 ? (
                <EmptyDataState
                  icon={CheckCircle2}
                  title={category ? `No ${category} tasks` : "No tasks found"}
                  description={category ? "There are no tasks in this category yet. Choose another category or show all tasks." : "No tasks are available on this page."}
                  actionLabel={category ? "Show all categories" : undefined}
                  actionOnClick={category ? () => changeCategory(ALL_CATEGORIES) : undefined}
                  className="min-h-[170px]"
                />
              ) : tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  busy={busyTaskId === task._id}
                  onView={(selected) => navigate(`/financial-tasks/${encodeURIComponent(selected._id)}`)}
                  onComplete={handleComplete}
                  onDelete={setDeletingTask}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/70 pt-4">
                <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
                <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {createOpen && <TaskFormDialog open onOpenChange={setCreateOpen} onCreate={handleCreate} categories={categoryOptions} />}
      {deletingTask && (
        <TaskDeleteDialog
          task={deletingTask}
          onOpenChange={(open) => { if (!open) setDeletingTask(null) }}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}

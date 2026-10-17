import { useEffect, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  Image as ImageIcon,
  ListTodo,
  Paperclip,
  Plus,
  RotateCw,
  Trash2,
  X,
} from "lucide-react"

import { completeTask, createTask, deleteTask, getTasks } from "@/api/tasks/tasks"
import { EmptyDataState } from "@/components/dashboard/empty-data-state"
import {
  Attachment,
  AttachmentAction,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
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
import { Textarea } from "@/components/ui/textarea"

const PAGE_SIZE = 10
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif", "application/pdf"]
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

function fileIsImage(url = "") {
  try {
    return /\.(jpe?g|png|gif)$/i.test(new URL(url).pathname)
  } catch {
    return /\.(jpe?g|png|gif)(?:$|\?)/i.test(url)
  }
}

function TaskFormDialog({ open, onOpenChange, onCreate }) {
  const [taskName, setTaskName] = useState("")
  const [taskDescription, setTaskDescription] = useState("")
  const [category, setCategory] = useState("")
  const [dateValue, setDateValue] = useState("")
  const [dueDateUnit, setDueDateUnit] = useState("days")
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  function chooseFile(file) {
    if (!file) {
      setSelectedFile(null)
      return
    }
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, GIF, or PDF file.")
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError("The attachment must be 5 MB or smaller.")
      return
    }
    setError("")
    setSelectedFile(file)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const cleanName = taskName.trim()
    const cleanDescription = taskDescription.trim()
    const cleanCategory = category.trim()

    if (!cleanName || !cleanDescription) {
      setError("Enter both a task name and a description.")
      return
    }
    if (dateValue && (!Number.isInteger(Number(dateValue)) || Number(dateValue) < 1)) {
      setError("Enter a whole number of at least 1 for the due date.")
      return
    }

    setSaving(true)
    setError("")
    try {
      await onCreate({
        taskName: cleanName,
        taskDescription: cleanDescription,
        ...(cleanCategory ? { category: cleanCategory } : {}),
        ...(dateValue ? { dateValue, dueDateUnit } : {}),
        ...(selectedFile ? { document: selectedFile } : {}),
      })
      onOpenChange(false)
    } catch (submitError) {
      setError(submitError.message || "We couldn’t create this task. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !saving && onOpenChange(nextOpen)}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Add a financial task</DialogTitle>
          <DialogDescription>
            Keep a money-related action organized. A due date and attachment are both optional.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="task-name">Task name <span className="text-destructive">*</span></Label>
            <Input
              id="task-name"
              autoFocus
              required
              maxLength={120}
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
              placeholder="e.g. Review my monthly bank statement"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-description">Description <span className="text-destructive">*</span></Label>
            <Textarea
              id="task-description"
              required
              maxLength={1000}
              value={taskDescription}
              onChange={(event) => setTaskDescription(event.target.value)}
              placeholder="Add details that will help you complete this task."
              className="min-h-24"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="task-category">Category <span className="font-normal text-muted-foreground">(optional)</span></Label>
            <Input
              id="task-category"
              maxLength={60}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="e.g. Bills, banking, insurance"
            />
          </div>

          <section className="space-y-3 rounded-xl border border-border/80 bg-muted/25 p-4" aria-labelledby="task-deadline-heading">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 id="task-deadline-heading" className="text-sm font-medium">Due date <span className="font-normal text-muted-foreground">(optional)</span></h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Set a reminder relative to now, or leave it blank if this task has no deadline.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
              <div className="space-y-1.5">
                <Label htmlFor="task-date-value" className="text-xs text-muted-foreground">Due in</Label>
                <Input
                  id="task-date-value"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={dateValue}
                  onChange={(event) => setDateValue(event.target.value)}
                  placeholder="No deadline"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-date-unit" className="text-xs text-muted-foreground">Time unit</Label>
                <select
                  id="task-date-unit"
                  value={dueDateUnit}
                  onChange={(event) => setDueDateUnit(event.target.value)}
                  disabled={!dateValue}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60"
                >
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-3 rounded-xl border border-border/80 bg-muted/25 p-4" aria-labelledby="task-attachment-heading">
            <div className="flex items-start gap-3">
              <Paperclip className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h3 id="task-attachment-heading" className="text-sm font-medium">Attachment <span className="font-normal text-muted-foreground">(optional)</span></h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Attach a picture or PDF if it helps. JPG, PNG, GIF, or PDF · up to 5 MB.
                </p>
              </div>
            </div>
            <Input
              id="task-document"
              type="file"
              accept="image/jpeg,image/png,image/gif,application/pdf"
              disabled={saving}
              onChange={(event) => chooseFile(event.target.files?.[0])}
              className="h-auto cursor-pointer file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-primary"
              aria-label="Choose an optional task picture or PDF"
            />
            {selectedFile && (
              <Attachment className="w-full">
                <AttachmentMedia className="size-11">
                  {selectedFile.type.startsWith("image/")
                    ? <ImageIcon aria-hidden="true" />
                    : <FileText aria-hidden="true" />}
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>{selectedFile.name}</AttachmentTitle>
                  <span className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </AttachmentContent>
                <AttachmentAction
                  type="button"
                  aria-label="Remove selected attachment"
                  title="Remove attachment"
                  disabled={saving}
                  onClick={() => {
                    setSelectedFile(null)
                    const input = document.getElementById("task-document")
                    if (input) input.value = ""
                  }}
                >
                  <X aria-hidden="true" />
                </AttachmentAction>
              </Attachment>
            )}
          </section>
          {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
          <DialogFooter>
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

function TaskCard({ task, onComplete, onDelete, busy }) {
  const status = TASK_STATUSES[task.status] ?? { label: task.status || "In progress", variant: "outline" }
  const hasImage = task.document && fileIsImage(task.document)

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border/80 bg-card p-4 transition-colors hover:bg-muted/20 sm:flex-row sm:items-start sm:p-5">
      {task.document && (
        <Attachment className="w-full max-w-sm sm:w-56">
          <AttachmentMedia variant={hasImage ? "image" : "icon"} className="size-14 opacity-100">
            {hasImage
              ? <img src={task.document} alt={`Attachment for ${task.name}`} />
              : <FileText aria-hidden="true" />}
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>{task.document.split("/").at(-1)?.split("?")[0] || "Task attachment"}</AttachmentTitle>
            <span className="text-xs text-muted-foreground">{hasImage ? "Image attachment" : "PDF attachment"}</span>
          </AttachmentContent>
        </Attachment>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="break-words text-base font-semibold">{task.name || "Untitled task"}</h2>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
        <p className="mt-1.5 whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">{task.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
          </span>
          {task.category && (
            <span className="rounded-full border border-border px-2.5 py-1">{task.category}</span>
          )}
          {task.document && (
            <a href={task.document} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
              {hasImage ? <ImageIcon className="size-3.5" aria-hidden="true" /> : <FileText className="size-3.5" aria-hidden="true" />}
              View attachment
            </a>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:justify-end">
        {task.status === "in_progress" && (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => onComplete(task)}>
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
  const [tasks, setTasks] = useState([])
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
  const requestKey = `${page}:${reloadKey}`
  const loading = loadedRequestKey !== requestKey
  const loadError = loadErrorKey === requestKey

  useEffect(() => {
    let active = true

    getTasks({ page, limit: PAGE_SIZE })
      .then((result) => {
        if (!active) return
        if (!result.tasks.length && page > 1 && result.totalPages > 0 && page > result.totalPages) {
          setPage(result.totalPages)
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
  }, [page, reloadKey, requestKey])

  async function handleCreate(values) {
    await createTask(values)
    setPage(1)
    setReloadKey((key) => key + 1)
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
      ) : tasks.length === 0 ? (
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
              <CardDescription className="mt-1">{totalTasks} {totalTasks === 1 ? "task" : "tasks"} to keep on top of</CardDescription>
            </div>
            {totalPages > 1 && <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>}
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="flex items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              <CalendarClock className="size-4 shrink-0 text-primary" aria-hidden="true" />
              Deadlines and attachments are optional.               Removed tasks are sent to your history.
            </div>
            <div className="space-y-3" aria-busy={loading}>
              {tasks.map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  busy={busyTaskId === task._id}
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

      {createOpen && <TaskFormDialog open onOpenChange={setCreateOpen} onCreate={handleCreate} />}
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

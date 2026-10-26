'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { formatCurrency } from '@/lib/commission'
import { Plus, Loader2, ClipboardList, Pencil, Trash2 } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  default_price: number
  category: string | null
  is_active: boolean
  created_at: string
}

interface ServicesClientProps {
  services: Service[]
  businessId: string
}

export function ServicesClient({ services: initialServices, businessId }: ServicesClientProps) {
  const router = useRouter()
  const [services, setServices] = useState(initialServices)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [serviceName, setServiceName] = useState('')
  const [serviceDescription, setServiceDescription] = useState('')
  const [servicePrice, setServicePrice] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')

  function openEditDialog(service: Service) {
    setEditingService(service)
    setServiceName(service.name)
    setServiceDescription(service.description || '')
    setServicePrice(service.default_price.toString())
    setServiceCategory(service.category || '')
    setDialogOpen(true)
  }

  function resetForm() {
    setEditingService(null)
    setServiceName('')
    setServiceDescription('')
    setServicePrice('')
    setServiceCategory('')
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const serviceData = {
      name: serviceName,
      description: serviceDescription || null,
      default_price: parseFloat(servicePrice),
      category: serviceCategory || null,
      business_id: businessId,
    }

    if (editingService) {
      const { error: updateError } = await supabase
        .from('services')
        .update(serviceData)
        .eq('id', editingService.id)
        .eq('business_id', businessId)

      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setServices(prev => prev.map(s => 
        s.id === editingService.id ? { ...s, ...serviceData } : s
      ))
    } else {
      const { data, error: insertError } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      setServices(prev => [data, ...prev])
    }

    setDialogOpen(false)
    resetForm()
    setLoading(false)
    router.refresh()
  }

  async function toggleServiceActive(serviceId: string, isActive: boolean) {
    const supabase = createClient()
    await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', serviceId)
      .eq('business_id', businessId)

    setServices(prev => prev.map(s => 
      s.id === serviceId ? { ...s, is_active: isActive } : s
    ))
    router.refresh()
  }

  async function deleteService(serviceId: string) {
    if (!confirm('Are you sure you want to delete this service?')) return

    const supabase = createClient()
    await supabase
      .from('services')
      .delete()
      .eq('id', serviceId)
      .eq('business_id', businessId)

    setServices(prev => prev.filter(s => s.id !== serviceId))
    router.refresh()
  }

  const activeServices = services.filter(s => s.is_active)
  const categories = [...new Set(services.map(s => s.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">Manage your service catalog and pricing</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? 'Edit Service' : 'Add Service'}</DialogTitle>
              <DialogDescription>
                {editingService 
                  ? 'Update the service details below.' 
                  : 'Add a new service that staff can select when logging entries.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <FieldGroup className="py-4">
                <Field>
                  <FieldLabel htmlFor="serviceName">Service Name</FieldLabel>
                  <Input
                    id="serviceName"
                    type="text"
                    placeholder="e.g., Haircut, Massage, Facial"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="serviceDescription">Description (Optional)</FieldLabel>
                  <Textarea
                    id="serviceDescription"
                    placeholder="Brief description of the service..."
                    value={serviceDescription}
                    onChange={(e) => setServiceDescription(e.target.value)}
                    rows={2}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="servicePrice">Default Price ($)</FieldLabel>
                    <Input
                      id="servicePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="50.00"
                      value={servicePrice}
                      onChange={(e) => setServicePrice(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="serviceCategory">Category (Optional)</FieldLabel>
                    <Input
                      id="serviceCategory"
                      type="text"
                      placeholder="e.g., Hair, Spa"
                      value={serviceCategory}
                      onChange={(e) => setServiceCategory(e.target.value)}
                      list="categories"
                    />
                    <datalist id="categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat || ''} />
                      ))}
                    </datalist>
                  </Field>
                </div>
              </FieldGroup>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm mb-4">
                  {error}
                </div>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setDialogOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingService ? 'Saving...' : 'Adding...'}
                    </>
                  ) : (
                    editingService ? 'Save Changes' : 'Add Service'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeServices.length}</p>
              <p className="text-sm text-muted-foreground">Active services</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center">
              <span className="text-chart-2 font-bold">{categories.length}</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{categories.length}</p>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Catalog</CardTitle>
          <CardDescription>Services available for staff to log</CardDescription>
        </CardHeader>
        <CardContent>
          {services.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No services yet</p>
              <p className="text-sm mt-1">Add your first service to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className={`flex items-center gap-4 p-4 rounded-lg border border-border ${
                    !service.is_active ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{service.name}</p>
                      {service.category && (
                        <Badge variant="secondary" className="text-xs">
                          {service.category}
                        </Badge>
                      )}
                      {!service.is_active && (
                        <Badge variant="outline" className="text-xs">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {service.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(service.default_price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={service.is_active}
                      onCheckedChange={(checked) => toggleServiceActive(service.id, checked)}
                    />
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => openEditDialog(service)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => deleteService(service.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

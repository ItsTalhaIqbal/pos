"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { MenuSkeleton } from "@/components/skeletons/MenuSkeleton"
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChefHat,
  Clock,
  RefreshCw,
  Eye,
  EyeOff,
  X
} from "lucide-react"

const emptyItemForm = {
  name: '',
  description: '',
  price: '',
  categoryId: '',
  preparationTime: '15',
  isAvailable: true,
  allowToppings: false,
  tags: ''
}

const emptyToppingForm = { name: '', price: '', isAvailable: true }

export default function MenuPage() {
  const [view, setView] = useState('items') // 'items' | 'toppings'
  const [items, setItems] = useState([])
  const [toppings, setToppings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters (all applied instantly on the client)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [availabilityFilter, setAvailabilityFilter] = useState("all") // all | available | unavailable
  const [toppingsFilter, setToppingsFilter] = useState("all") // all | with | without
  const [sortBy, setSortBy] = useState("default") // default | name | price-asc | price-desc

  // Item dialog
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState(emptyItemForm)

  // Topping dialog
  const [showToppingDialog, setShowToppingDialog] = useState(false)
  const [editingTopping, setEditingTopping] = useState(null)
  const [toppingForm, setToppingForm] = useState(emptyToppingForm)

  const fetchAll = useCallback(async (signal) => {
    try {
      const [catRes, itemRes, topRes] = await Promise.all([
        fetch('/api/categories?activeOnly=true', { signal }).then(r => r.json()),
        fetch('/api/items?includeUnavailable=true', { signal }).then(r => r.json()),
        fetch('/api/toppings?all=true', { signal, cache: 'no-store' }).then(r => r.json()),
      ])
      if (catRes.categories) setCategories(catRes.categories)
      if (itemRes.items) setItems(itemRes.items)
      if (topRes.toppings) setToppings(topRes.toppings)
    } catch (error) {
      if (error.name === 'AbortError') return
      console.error('Error loading menu data:', error)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    fetchAll(controller.signal).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [fetchAll])

  const refresh = async () => {
    setIsRefreshing(true)
    await fetchAll()
    setIsRefreshing(false)
  }

  /* ------------------------------ Filters -------------------------------- */

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    let result = items.filter(item => {
      if (selectedCategory !== 'all' && item.categoryId?._id !== selectedCategory) return false
      if (availabilityFilter === 'available' && !item.isAvailable) return false
      if (availabilityFilter === 'unavailable' && item.isAvailable) return false
      if (toppingsFilter === 'with' && !item.allowToppings) return false
      if (toppingsFilter === 'without' && item.allowToppings) return false
      if (term) {
        const haystack = `${item.name} ${item.description || ''} ${(item.tags || []).join(' ')}`.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })

    if (sortBy === 'name') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price)

    return result
  }, [items, searchTerm, selectedCategory, availabilityFilter, toppingsFilter, sortBy])

  const hasActiveFilters =
    searchTerm || selectedCategory !== 'all' || availabilityFilter !== 'all' ||
    toppingsFilter !== 'all' || sortBy !== 'default'

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setAvailabilityFilter("all")
    setToppingsFilter("all")
    setSortBy("default")
  }

  /* ------------------------------- Items --------------------------------- */

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim() || formData.price === '' || !formData.categoryId) {
      alert('Name, price, and category are required')
      return
    }

    try {
      const itemData = {
        ...formData,
        price: parseFloat(formData.price),
        preparationTime: parseInt(formData.preparationTime) || 15,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      }

      const url = editingItem ? `/api/items/${editingItem._id}` : '/api/items'
      const method = editingItem ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemData),
      })

      if (response.ok) {
        await fetchAll()
        closeDialog()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to save item')
      }
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Failed to save item')
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      categoryId: item.categoryId._id,
      preparationTime: item.preparationTime.toString(),
      isAvailable: item.isAvailable,
      allowToppings: !!item.allowToppings,
      tags: item.tags ? item.tags.join(', ') : ''
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const response = await fetch(`/api/items/${itemId}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchAll()
      } else {
        alert('Failed to delete item')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Failed to delete item')
    }
  }

  const toggleAvailability = async (item) => {
    try {
      const response = await fetch(`/api/items/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !item.isAvailable }),
      })

      if (response.ok) {
        await fetchAll()
      } else {
        alert('Failed to update item availability')
      }
    } catch (error) {
      console.error('Error updating availability:', error)
      alert('Failed to update item availability')
    }
  }

  const closeDialog = () => {
    setShowAddDialog(false)
    setEditingItem(null)
    setFormData(emptyItemForm)
  }

  /* ----------------------------- Toppings -------------------------------- */

  const handleToppingSubmit = async (e) => {
    e.preventDefault()

    if (!toppingForm.name.trim() || toppingForm.price === '') {
      alert('Name and price are required')
      return
    }

    try {
      const url = editingTopping ? `/api/toppings/${editingTopping._id}` : '/api/toppings'
      const method = editingTopping ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: toppingForm.name.trim(),
          price: parseFloat(toppingForm.price),
          isAvailable: toppingForm.isAvailable
        }),
      })

      if (response.ok) {
        await fetchAll()
        closeToppingDialog()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to save topping')
      }
    } catch (error) {
      console.error('Error saving topping:', error)
      alert('Failed to save topping')
    }
  }

  const handleToppingEdit = (topping) => {
    setEditingTopping(topping)
    setToppingForm({
      name: topping.name,
      price: topping.price.toString(),
      isAvailable: topping.isAvailable
    })
    setShowToppingDialog(true)
  }

  const handleToppingDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this topping?')) return

    try {
      const response = await fetch(`/api/toppings/${id}`, { method: 'DELETE' })
      if (response.ok) {
        await fetchAll()
      } else {
        alert('Failed to delete topping')
      }
    } catch (error) {
      console.error('Error deleting topping:', error)
      alert('Failed to delete topping')
    }
  }

  const toggleToppingAvailability = async (topping) => {
    try {
      const response = await fetch(`/api/toppings/${topping._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable: !topping.isAvailable }),
      })
      if (response.ok) {
        await fetchAll()
      } else {
        alert('Failed to update topping availability')
      }
    } catch (error) {
      console.error('Error updating topping:', error)
      alert('Failed to update topping availability')
    }
  }

  const closeToppingDialog = () => {
    setShowToppingDialog(false)
    setEditingTopping(null)
    setToppingForm(emptyToppingForm)
  }

  if (loading) {
    return <MenuSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-y-5">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={refresh} variant="outline" disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {view === 'items' ? (
            <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) closeDialog(); else setShowAddDialog(true) }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingItem(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background">
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingItem
                      ? 'Update the menu item details below.'
                      : 'Create a new item for your menu.'
                    }
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Item name"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Item description"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-sm font-medium">Price (PKR) *</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Prep Time (min)</label>
                      <Input
                        type="number"
                        value={formData.preparationTime}
                        onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                        placeholder="15"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Category *</label>
                    <Select value={formData.categoryId} onValueChange={(value) => setFormData({ ...formData, categoryId: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Tags</label>
                    <Input
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="spicy, popular (comma separated)"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="isAvailable"
                        checked={formData.isAvailable}
                        onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                      />
                      <label htmlFor="isAvailable" className="text-sm font-medium">Available</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="allowToppings"
                        checked={formData.allowToppings}
                        onChange={(e) => setFormData({ ...formData, allowToppings: e.target.checked })}
                      />
                      <label htmlFor="allowToppings" className="text-sm font-medium">
                        Allow toppings / add-ons
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingItem ? 'Update' : 'Add'} Item
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          ) : (
            <Dialog open={showToppingDialog} onOpenChange={(open) => { if (!open) closeToppingDialog(); else setShowToppingDialog(true) }}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTopping(null)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Topping
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md bg-background">
                <DialogHeader>
                  <DialogTitle>
                    {editingTopping ? 'Edit Topping' : 'Add New Topping'}
                  </DialogTitle>
                  <DialogDescription>
                    Toppings / add-ons can be added to any item that allows them.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleToppingSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Name *</label>
                    <Input
                      value={toppingForm.name}
                      onChange={(e) => setToppingForm({ ...toppingForm, name: e.target.value })}
                      placeholder="e.g. Extra Cheese"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Price (PKR) *</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={toppingForm.price}
                      onChange={(e) => setToppingForm({ ...toppingForm, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="toppingAvailable"
                      checked={toppingForm.isAvailable}
                      onChange={(e) => setToppingForm({ ...toppingForm, isAvailable: e.target.checked })}
                    />
                    <label htmlFor="toppingAvailable" className="text-sm font-medium">Available</label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={closeToppingDialog}>
                      Cancel
                    </Button>
                    <Button type="submit">
                      {editingTopping ? 'Update' : 'Add'} Topping
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* View switch */}
      <div className="inline-flex rounded-lg border p-1 gap-1">
        <Button
          size="sm"
          variant={view === 'items' ? 'default' : 'ghost'}
          onClick={() => setView('items')}
        >
          Menu Items ({items.length})
        </Button>
        <Button
          size="sm"
          variant={view === 'toppings' ? 'default' : 'ghost'}
          onClick={() => setView('toppings')}
        >
          Toppings &amp; Add-ons ({toppings.length})
        </Button>
      </div>

      {view === 'items' ? (
        <>
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4 flex-wrap items-end">
                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search menu items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-[240px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="min-w-[180px]">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Availability</label>
                  <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                    <SelectTrigger className="min-w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="unavailable">Unavailable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Toppings</label>
                  <Select value={toppingsFilter} onValueChange={setToppingsFilter}>
                    <SelectTrigger className="min-w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="with">Toppings allowed</SelectItem>
                      <SelectItem value="without">No toppings</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-sm font-medium">Sort by</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="min-w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-asc">Price: Low to High</SelectItem>
                      <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" />
                    Clear filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Menu Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Menu Items ({filteredItems.length}{filteredItems.length !== items.length ? ` of ${items.length}` : ''})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No menu items found
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Prep Time</TableHead>
                      <TableHead>Add-ons</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <ChefHat className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{item.name}</div>
                              {item.description && (
                                <div className="text-sm text-muted-foreground">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: item.categoryId?.color }}>
                            {item.categoryId?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          PKR {item.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.preparationTime}m
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.allowToppings
                            ? <Badge variant="secondary">Allowed</Badge>
                            : <span className="text-muted-foreground text-sm">No</span>}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAvailability(item)}
                            className={item.isAvailable ? 'text-green-600' : 'text-red-600'}
                          >
                            {item.isAvailable ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                Available
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Unavailable
                              </>
                            )}
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {item.tags?.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(item._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Toppings & add-ons */
        <Card>
          <CardHeader>
            <CardTitle>Toppings &amp; Add-ons ({toppings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {toppings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No toppings yet. Click &quot;Add Topping&quot; to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {toppings.map((topping) => (
                    <TableRow key={topping._id}>
                      <TableCell className="font-medium">{topping.name}</TableCell>
                      <TableCell>PKR {topping.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleToppingAvailability(topping)}
                          className={topping.isAvailable ? 'text-green-600' : 'text-red-600'}
                        >
                          {topping.isAvailable ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Available
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Unavailable
                            </>
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleToppingEdit(topping)}>
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleToppingDelete(topping._id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

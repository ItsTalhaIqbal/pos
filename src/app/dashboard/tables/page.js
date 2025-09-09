"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { TablesSkeleton } from "@/components/skeletons/TablesSkeleton"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

export default function TablesPage() {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingTable, setEditingTable] = useState(null)
  const [formData, setFormData] = useState({
    number: '',
    capacity: '',
    location: '',
    notes: ''
  })

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tables')
      const data = await response.json()
      if (data.tables) {
        setTables(data.tables)
      }
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const url = editingTable ? `/api/tables/${editingTable._id}` : '/api/tables'
      const method = editingTable ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: parseInt(formData.number),
          capacity: parseInt(formData.capacity),
          location: formData.location,
          notes: formData.notes
        }),
      })

      if (response.ok) {
        await fetchTables()
        setShowAddDialog(false)
        setEditingTable(null)
        setFormData({ number: '', capacity: '', location: '', notes: '' })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save table')
      }
    } catch (error) {
      console.error('Error saving table:', error)
      alert('Failed to save table')
    }
  }

  const handleEdit = (table) => {
    setEditingTable(table)
    setFormData({
      number: table.number.toString(),
      capacity: table.capacity.toString(),
      location: table.location || '',
      notes: table.notes || ''
    })
    setShowAddDialog(true)
  }

  const handleDelete = async (tableId) => {
    if (!confirm('Are you sure you want to delete this table?')) return
    
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchTables()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to delete table')
      }
    } catch (error) {
      console.error('Error deleting table:', error)
      alert('Failed to delete table')
    }
  }

  const updateTableStatus = async (tableId, status) => {
    try {
      const response = await fetch(`/api/tables/${tableId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        await fetchTables()
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to update table status')
      }
    } catch (error) {
      console.error('Error updating table status:', error)
      alert('Failed to update table status')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'occupied': return 'bg-red-100 text-red-800'
      case 'reserved': return 'bg-yellow-100 text-yellow-800'
      case 'cleaning': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available': return <CheckCircle className="h-4 w-4" />
      case 'occupied': return <XCircle className="h-4 w-4" />
      case 'reserved': return <Clock className="h-4 w-4" />
      case 'cleaning': return <AlertCircle className="h-4 w-4" />
      default: return null
    }
  }

  if (loading) {
    return <TablesSkeleton />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <h1 className="text-3xl font-bold tracking-tight">Table Management</h1>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingTable(null)
              setFormData({ number: '', capacity: '', location: '', notes: '' })
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTable ? 'Edit Table' : 'Add New Table'}
              </DialogTitle>
              <DialogDescription>
                {editingTable 
                  ? 'Update the table information below.' 
                  : 'Create a new table for your restaurant.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Table Number</label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({...formData, number: e.target.value})}
                  required
                  min="1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Capacity</label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  required
                  min="1"
                  max="20"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Location</label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="e.g., Window side, Corner, VIP section"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Any special notes about this table"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTable ? 'Update Table' : 'Add Table'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tables.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <div className="text-lg text-muted-foreground">No tables found</div>
            <p className="text-sm text-muted-foreground mt-2">
              Click &quot;Add Table&quot; to create your first table
            </p>
          </div>
        ) : (
          tables.map((table) => (
            <Card key={table._id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Table {table.number}</CardTitle>
                  <Badge className={getStatusColor(table.status)}>
                    {getStatusIcon(table.status)}
                    <span className="ml-1 capitalize">{table.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{table.capacity} seats</span>
                </div>
                
                {table.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{table.location}</span>
                  </div>
                )}
                
                {table.currentOrderId && (
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    <div className="font-medium">Current Order:</div>
                    <div>{table.currentOrderId.orderNumber}</div>
                    <div>{table.currentOrderId.customerName}</div>
                  </div>
                )}
                
                {table.notes && (
                  <div className="text-xs text-muted-foreground">
                    {table.notes}
                  </div>
                )}
                
                {/* Status Update Buttons */}
                <div className="flex gap-1 flex-wrap">
                  {table.status !== 'available' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTableStatus(table._id, 'available')}
                      className="text-xs"
                    >
                      Mark Available
                    </Button>
                  )}
                  {table.status !== 'cleaning' && table.status !== 'occupied' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTableStatus(table._id, 'cleaning')}
                      className="text-xs"
                    >
                      Cleaning
                    </Button>
                  )}
                  {table.status !== 'reserved' && table.status !== 'occupied' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateTableStatus(table._id, 'reserved')}
                      className="text-xs"
                    >
                      Reserve
                    </Button>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(table)}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(table._id)}
                    disabled={table.status === 'occupied'}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

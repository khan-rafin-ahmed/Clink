import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SortOption = 'newest' | 'trending' | 'date' | 'popular'
export type FilterOption = 'all' | 'tonight' | 'tomorrow' | 'weekend' | 'next-week'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilters: (filters: {
    sortBy: SortOption
    filterBy: FilterOption
    drinkFilter: string
  }) => void
  currentFilters: {
    sortBy: SortOption
    filterBy: FilterOption
    drinkFilter: string
  }
}

export function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }: FilterModalProps) {
  const [sortBy, setSortBy] = useState<SortOption>(currentFilters.sortBy)
  const [filterBy, setFilterBy] = useState<FilterOption>(currentFilters.filterBy)
  const [drinkFilter, setDrinkFilter] = useState<string>(currentFilters.drinkFilter)

  // Update local state when modal opens with current filters
  useEffect(() => {
    if (isOpen) {
      setSortBy(currentFilters.sortBy)
      setFilterBy(currentFilters.filterBy)
      setDrinkFilter(currentFilters.drinkFilter)
    }
  }, [isOpen, currentFilters])

  const handleApply = () => {
    onApplyFilters({
      sortBy,
      filterBy,
      drinkFilter
    })
    onClose()
  }

  const handleClear = () => {
    setSortBy('newest')
    setFilterBy('all')
    setDrinkFilter('all')
  }

  const handleReset = () => {
    handleClear()
    onApplyFilters({
      sortBy: 'newest',
      filterBy: 'all',
      drinkFilter: 'all'
    })
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-[#08090A] border border-white/10 rounded-xl p-6">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold text-white">
            Filter Sessions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sort Options */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Sort</Label>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="h-12 bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-[#08090A] border border-white/10">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Session Type (Time Filter) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Session Type</Label>
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="h-12 bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <SelectValue placeholder="When" />
              </SelectTrigger>
              <SelectContent className="bg-[#08090A] border border-white/10">
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="tonight">Tonight</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="weekend">This Weekend</SelectItem>
                <SelectItem value="next-week">Next Week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drink Type */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-white">Drink Type</Label>
            <Select value={drinkFilter} onValueChange={setDrinkFilter}>
              <SelectTrigger className="h-12 bg-white/5 backdrop-blur-md border border-white/10 text-white">
                <SelectValue placeholder="Drink Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  <span className="w-5 h-5 flex items-center justify-center">🍻</span>
                  All Drinks
                </SelectItem>
                <SelectItem value="beer">
                  <span className="w-5 h-5 flex items-center justify-center">🍺</span>
                  Beer
                </SelectItem>
                <SelectItem value="wine">
                  <span className="w-5 h-5 flex items-center justify-center">🍷</span>
                  Wine
                </SelectItem>
                <SelectItem value="cocktails">
                  <span className="w-5 h-5 flex items-center justify-center">🍸</span>
                  Cocktails
                </SelectItem>
                <SelectItem value="whiskey">
                  <span className="w-5 h-5 flex items-center justify-center">🥃</span>
                  Whiskey
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleApply}
            className="w-full bg-white text-[#08090A] hover:bg-white/90 font-medium"
          >
            Apply Filters
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handleClear}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Clear All
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

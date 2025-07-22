"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Save, Users, Building2, CreditCard, MapPin, Clock } from "lucide-react"
import { LuPlay, LuSave, LuTrash } from "react-icons/lu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { croatianBanks } from "@/lib/croatianPaymentData"
import type { PaymentFormData } from "@/lib/schema"

interface SavedData {
  id: string
  name: string
  street: string
  postcode: string
  city: string
  iban?: string
  savedAt: string
}

interface EnhancedDataManagerProps {
  type: "sender" | "receiver"
  currentData: Partial<PaymentFormData>
  onDataLoad: (data: Partial<PaymentFormData>) => void
}

export function EnhancedDataManager({ type, currentData, onDataLoad }: EnhancedDataManagerProps) {
  const [savedData, setSavedData] = useState<SavedData[]>([])
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobile, setIsMobile] = useState(false)
  const { toast } = useToast()

  const isSender = type === "sender"
  const storageKey = `saved_${type}_data`

  useEffect(() => {
    loadSavedData()
    
    // Check if mobile on mount and resize
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const loadSavedData = () => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setSavedData(JSON.parse(stored))
      }
    } catch (error) {
      console.error("Error loading saved data:", error)
    }
  }

  const saveData = () => {
    const nameKey = isSender ? "senderName" : "receiverName"
    const streetKey = isSender ? "senderStreet" : "receiverStreet"
    const postcodeKey = isSender ? "senderPostcode" : "receiverPostcode"
    const cityKey = isSender ? "senderCity" : "receiverCity"

    if (!currentData[nameKey] || !currentData[streetKey] || !currentData[postcodeKey] || !currentData[cityKey]) {
      toast({
        title: "Greška",
        description: "Molimo popunite sve potrebne podatke prije spremanja.",
        variant: "destructive"
      })
      return
    }

    const newData: SavedData = {
      id: `${type}_${Date.now()}`,
      name: currentData[nameKey] as string,
      street: currentData[streetKey] as string,
      postcode: currentData[postcodeKey] as string,
      city: currentData[cityKey] as string,
      iban: !isSender ? currentData.iban : undefined,
      savedAt: new Date().toISOString()
    }

    const updatedData = [...savedData, newData]
    setSavedData(updatedData)
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    
    toast({
      title: "Uspjeh",
      description: `${isSender ? "Platitelj" : "Primatelj"} je uspješno spremljen.`
    })
    
    setSaveDialogOpen(false)
  }

  const deleteData = (id: string) => {
    const updatedData = savedData.filter(item => item.id !== id)
    setSavedData(updatedData)
    localStorage.setItem(storageKey, JSON.stringify(updatedData))
    
    toast({
      title: "Uspjeh",
      description: "Podatci su obrisani."
    })
  }

  const loadData = (data: SavedData) => {
    const loadedData: Partial<PaymentFormData> = {}
    
    if (isSender) {
      loadedData.senderName = data.name
      loadedData.senderStreet = data.street
      loadedData.senderPostcode = data.postcode
      loadedData.senderCity = data.city
    } else {
      loadedData.receiverName = data.name
      loadedData.receiverStreet = data.street
      loadedData.receiverPostcode = data.postcode
      loadedData.receiverCity = data.city
      if (data.iban) {
        loadedData.iban = data.iban
      }
    }
    
    onDataLoad(loadedData)
    toast({
      title: "Uspjeh",
      description: "Podatci su učitani."
    })
  }

  const getIBANDisplay = (iban: string) => {
    if (iban.length < 21) {
      return <span className="font-mono text-xs">{iban}</span>
    }
    
    return (
      <span className="font-mono text-xs">
        {iban.substring(0, 2)}
        <span className="text-blue-500 font-bold">{iban.substring(2, 4)}</span>
        {" "}
        <span className="text-green-700">{iban.substring(4, 8)}</span>
        {" "}
        <span className="text-green-700">{iban.substring(8, 10)}</span>
        <span className="text-green-500 font-bold">{iban.substring(10, 11)}</span>
        <span className="text-orange-500">{iban.substring(11, 12)}</span>
        {" "}
        <span className="text-orange-500">{iban.substring(12, 16)}</span>
        {" "}
        <span className="text-orange-500">{iban.substring(16, 20)}</span>
        {" "}
        <span className="text-orange-300 font-bold">{iban.substring(20, 21)}</span>
      </span>
    )
  }

  const getBankName = (iban: string) => {
    const bankCode = iban.substring(4, 11) // HR + 2 check digits, then 7-digit bank code
    const bank = croatianBanks.find(b => b.code === bankCode)
    return bank ? bank.name : "Nepoznata banka"
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Upravo"
    if (diffInMinutes < 60) return `Prije ${diffInMinutes}min`
    if (diffInMinutes < 1440) return `Prije ${Math.floor(diffInMinutes / 60)}h`
    return `Prije ${Math.floor(diffInMinutes / 1440)}d`
  }

  // Filter and sort data
  const filteredData = savedData.filter(data => 
    data.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    data.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
    data.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (data.iban && data.iban.includes(searchQuery))
  )

  const sortedData = [...filteredData].sort((a, b) => {
    return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  })

  return (
    <TooltipProvider>
      <Card className="h-fit bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {isSender ? <Users className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
            Spremljeni {isSender ? "platitelji" : "primatelji"}
            <div className="flex items-center gap-2 ml-auto">
              <Badge variant="secondary" className="bg-primary/10">
                {savedData.length}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Save Current Data Button */}
          <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full transition-all duration-200 hover:scale-105"
              >
                <LuSave className="mr-2 h-3 w-3" />
                Spremi trenutne podatke
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Spremi {isSender ? "platitelja" : "primatelja"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Želite li spremiti trenutne podatke za buduće korištenje?
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                    Odustani
                  </Button>
                  <Button onClick={saveData}>
                    <Save className="mr-2 h-4 w-4" />
                    Spremi
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Search */}
          {savedData.length > 3 && (
            <Input
              placeholder={`Pretraži ${isSender ? "platitelje" : "primatelje"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm"
            />
          )}

          {savedData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                {isSender ? <Users className="h-6 w-6" /> : <Building2 className="h-6 w-6" />}
              </div>
              <p className="text-sm font-medium mb-1">Nema spremljenih podataka</p>
              <p className="text-xs">Počnite spremati često korištene kontakte</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto p-2">
              {sortedData.map((data) => (
                <div key={data.id} className="group relative">
                  <HoverCard openDelay={300} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      <div
                        className={cn(
                          "p-4 rounded-lg border cursor-pointer transition-all duration-300",
                          "hover:shadow-lg hover:scale-105 hover:border-primary/30",
                          hoveredItem === data.id && "bg-muted/50 shadow-md scale-105"
                        )}
                        onMouseEnter={() => setHoveredItem(data.id)}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => loadData(data)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium truncate">
                                {data.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {data.street}, {data.postcode} {data.city}
                              </p>
                              {!isSender && data.iban && (
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {getBankName(data.iban)}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    loadData(data)
                                  }}
                                >
                                  <LuPlay className="h-3 w-3 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Učitaj podatke</p>
                              </TooltipContent>
                            </Tooltip>
                            
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteData(data.id)
                                  }}
                                >
                                  <LuTrash className="h-3 w-3 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Obriši</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    </HoverCardTrigger>
                    
                    <HoverCardContent className="w-96" side={isMobile ? "bottom" : "left"} align="start" sideOffset={8}>
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                            {isSender ? <Users className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-base">{data.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Spremljeno {getRelativeTime(data.savedAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <Separator />
                        
                        {/* Details */}
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">Adresa</p>
                              <p className="text-sm text-muted-foreground">{data.street}</p>
                              <p className="text-sm text-muted-foreground">{data.postcode} {data.city}</p>
                            </div>
                          </div>
                          
                          {!isSender && data.iban && (
                            <div className="flex items-start gap-3">
                              <CreditCard className="h-4 w-4 mt-0.5 text-muted-foreground" />
                              <div className="flex-1">
                                <p className="text-sm font-medium">Bankovni račun</p>
                                <div className="text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {getIBANDisplay(data.iban)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {getBankName(data.iban)}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Separator />
                        
                        {/* Actions */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">
                            Kliknite za učitavanje
                          </p>
                          <Button
                            size="sm"
                            className="h-7"
                            onClick={() => loadData(data)}
                          >
                            <LuPlay className="mr-1 h-3 w-3" />
                            Učitaj
                          </Button>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              ))}
            </div>
          )}

          {/* Footer Stats */}
          {savedData.length > 0 && (
            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-center text-xs text-muted-foreground">
                <span>{savedData.length} {savedData.length === 1 ? 'kontakt' : 'kontakata'}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
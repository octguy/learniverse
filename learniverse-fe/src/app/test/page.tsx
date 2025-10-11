'use client';

import * as React from "react";
import { format } from "date-fns";
import {Facebook, Mail} from "lucide-react";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TabsList, TabsTrigger,Tabs ,TabsContent} from "@radix-ui/react-tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {AuthButton} from "@/components/auth/auth-button";
import {OTPVerificationDialog} from "@/components/auth/OTP-verification-dialog"
import {AvatarUploader} from "@/components/auth/avatar-uploader";
import {ProfileProgressBar} from "@/components/auth/profile-progress-bar";
import {TagSelector} from "@/components/auth/tag-selector";
import {useState} from "react";
import {ProfileCard} from "@/components/auth/profile-card";
import {ProfileEditForm} from "@/components/auth/profile-edit-form";

export default function ComponentTestPage() {
  const [date, setDate] = React.useState<Date>();
    const [mockSelected, setMockSelected] = useState<string[]>(["Toán học", "Vật lý"])

  return (
    <div className="dark mx-auto p-4 md:p-10">
      <h1 className="text-3xl font-bold mb-6">Shadcn/UI Component Playground</h1>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cards">Cards & Buttons</TabsTrigger>
          <TabsTrigger value="forms">Form Elements</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
            <TabsTrigger value="khai">Khải</TabsTrigger>
        </TabsList>
        
        {/* Tab 1: Cards & Buttons */}
        <TabsContent value="cards">
          <div className="grid gap-6 mt-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Các biến thể của Button component.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
                <Button>
                  <Mail className="mr-2 h-4 w-4" /> Login with Email
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dialog</CardTitle>
                <CardDescription>Cửa sổ pop-up modal.</CardDescription>
              </CardHeader>
              
            </Card>
            
            <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                    <CardTitle>Alert Dialog</CardTitle>
                    <CardDescription>Hộp thoại xác nhận hành động nguy hiểm.</CardDescription>
                </CardHeader>
                <CardContent>
                    
                </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Tab 2: Form Elements */}
        <TabsContent value="forms">
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Form Elements</CardTitle>
                    <CardDescription>Các thành phần cơ bản trong một form.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input type="email" id="email" placeholder="Email" />
                    </div>
                    <div>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Theme" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Light</SelectItem>
                                <SelectItem value="dark">Dark</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="flex items-center space-x-2">
                    
                        <Label htmlFor="airplane-mode">Airplane Mode</Label>
                    </div>
                    <div>
                         <Popover>
                            <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                "w-[280px] justify-start text-left font-normal",
                                !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Pick a date</span>}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        
        {/* Tab 3: Advanced Components */}
        <TabsContent value="advanced">
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Table</CardTitle>
                    <CardDescription>Hiển thị dữ liệu dạng bảng.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Invoice</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </TabsContent>

          <TabsContent value="khai">
              <CardHeader>
                  <CardTitle>Test</CardTitle>
                  <CardDescription></CardDescription>
              </CardHeader>
              <Card className="mt-6">
                  <AuthButton provider={"facebook"}/>
                  <AuthButton provider={"google"}/>
                  <AuthButton provider={"logout"}/>
                  <AuthButton provider={"login"}/>
                  <AuthButton provider={"register"}/>
              </Card>

              <Card className="mt-6">
                  <OTPVerificationDialog/>
              </Card>

              <Card>
                  <ProfileProgressBar value={50}/>
              </Card>

              <Card>
                  <TagSelector mode={"onboarding"} selectedTags={mockSelected} onChange={setMockSelected}/>
                  <TagSelector mode={"profile"} selectedTags={mockSelected} onChange={setMockSelected}/>
              </Card>

              <Card>
                  <ProfileCard displayName={"Nguyễn Quang Khải"}/>
              </Card>

              <Card>
                  <ProfileEditForm/>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import AppLayout from "@/components/Layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JobList from "@/components/Jobs/JobList";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function JobMapPage() {
  return (
    <AppLayout>
      <div>
        <h1 className="text-2xl font-bold mb-6">Find Jobs</h1>
        
        <Alert className="mb-6 border-secondary/50 bg-secondary/10">
          <AlertCircle className="h-4 w-4 text-secondary" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            The map functionality has been removed. Please use the list view to browse jobs.
          </AlertDescription>
        </Alert>
        
        <JobList filter="all" />
      </div>
    </AppLayout>
  );
}

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Car } from '@/types';
import apiClient from '@/lib/apiClient';

interface VehicleContextType {
  cars: Car[];
  selectedCarId: number | null;
  setSelectedCarId: (id: number | null) => void;
  loading: boolean;
}

const VehicleContext = createContext<VehicleContextType | undefined>(undefined);

interface VehicleProviderProps {
  children: React.ReactNode;
}

export function VehicleProvider({ children }: VehicleProviderProps) {
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCarId, setSelectedCarIdState] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('teslashow_car_id') : null;
    if (saved === 'all' || saved === null) {
      setSelectedCarIdState(null);
    } else {
      const id = parseInt(saved);
      setSelectedCarIdState(Number.isFinite(id) ? id : null);
    }
    const fetchCars = async () => {
      try {
        const res = await apiClient.get('/api/cars');
        const data = await res.json();
        setCars(Array.isArray(data.cars) ? data.cars : []);
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, []);

  const setSelectedCarId = (id: number | null) => {
    setSelectedCarIdState(id);
    if (typeof window !== 'undefined') {
      if (id === null) {
        localStorage.setItem('teslashow_car_id', 'all');
      } else {
        localStorage.setItem('teslashow_car_id', String(id));
      }
    }
  };

  const value: VehicleContextType = {
    cars,
    selectedCarId,
    setSelectedCarId,
    loading,
  };

  return <VehicleContext.Provider value={value}>{children}</VehicleContext.Provider>;
}

export function useVehicle(): VehicleContextType {
  const ctx = useContext(VehicleContext);
  if (!ctx) throw new Error('useVehicle must be used within a VehicleProvider');
  return ctx;
}
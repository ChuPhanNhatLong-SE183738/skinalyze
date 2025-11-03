import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import axios from 'axios';

// Forward reference to avoid circular dependency
import type { TrackingGateway } from './tracking.gateway';

export interface ETAResult {
  distance: number; // meters
  duration: number; // seconds
  text: string; // "5 phút", "10 phút"
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

  // Cache customer addresses để tránh geocode lại nhiều lần
  private customerAddresses: Map<string, { lat: number; lng: number }> = new Map();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('TrackingGateway')
    private trackingGateway: TrackingGateway,
  ) {}

  /**
   * ️ Lấy địa chỉ khách hàng và convert thành tọa độ
   */
  async getCustomerLocation(orderId: string): Promise<{ lat: number; lng: number } | null> {
    // Check cache
    if (this.customerAddresses.has(orderId)) {
      return this.customerAddresses.get(orderId) || null;
    }

    // Lấy order để có shipping address
    const order = await this.orderRepository.findOne({
      where: { orderId },
      select: ['orderId', 'shippingAddress'],
    });

    if (!order || !order.shippingAddress) {
      this.logger.warn(`No shipping address found for order ${orderId}`);
      return null;
    }

    // Gọi Goong Geocoding API để convert address → coordinates
    const coordinates = await this.geocodeAddress(order.shippingAddress);
    
    if (coordinates) {
      // Cache lại để lần sau không phải gọi API
      this.customerAddresses.set(orderId, coordinates);
      return coordinates;
    }

    this.logger.warn(`Failed to geocode address for order ${orderId}: ${order.shippingAddress}`);
    return null;
  }

  /**
   * 🧮 Tính ETA bằng Goong Distance Matrix API v2
   * Vehicle types: car (ô tô), bike (xe đạp), motorcycle (xe máy), truck (xe tải)
   */
  async calculateETA(
    shipperLocation: { lat: number; lng: number },
    customerLocation: { lat: number; lng: number },
  ): Promise<ETAResult | null> {
    try {
      const GOONG_API_KEY = process.env.GOONG_API_KEY;

      if (!GOONG_API_KEY) {
        this.logger.warn('⚠️ GOONG_API_KEY not configured');
        return null;
      }

      // Goong Distance Matrix API v2
      const url = 'https://rsapi.goong.io/v2/distancematrix';
      const params = {
        origins: `${shipperLocation.lat},${shipperLocation.lng}`,
        destinations: `${customerLocation.lat},${customerLocation.lng}`,
        vehicle: 'motorcycle', // motorcycle cho shipper (xe máy)
        api_key: GOONG_API_KEY,
      };

      this.logger.debug(`Calculating ETA: ${JSON.stringify(params)}`);

      const response = await axios.get(url, { params });

      if (response.data.rows && response.data.rows[0]?.elements?.[0]) {
        const element = response.data.rows[0].elements[0];

        if (element.status === 'OK') {
          const distance = element.distance.value; // meters
          const duration = element.duration.value; // seconds
          const durationText = element.duration.text; // "30 phút" (from Goong)

          this.logger.log(
            `✅ ETA calculated: ${durationText} (${(distance / 1000).toFixed(2)} km)`,
          );

          // Convert duration to readable text (fallback nếu Goong không trả text)
          const minutes = Math.ceil(duration / 60);
          const text = durationText || (minutes < 60 
            ? `${minutes} phút` 
            : `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`);

          return {
            distance,
            duration,
            text,
          };
        } else {
          this.logger.warn(`Distance Matrix status not OK: ${element.status}`);
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error calculating ETA: ${error.message}`);
      if (error.response) {
        this.logger.error(`Response data: ${JSON.stringify(error.response.data)}`);
      }
      return null;
    }
  }

  /**
   * 🗺️ Geocode address thành coordinates (Goong API V2)
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const GOONG_API_KEY = process.env.GOONG_API_KEY;

      if (!GOONG_API_KEY) {
        this.logger.warn('⚠️ GOONG_API_KEY not configured');
        return null;
      }

      // Goong Geocoding API V2
      const url = 'https://rsapi.goong.io/v2/geocode';
      const response = await axios.get(url, {
        params: {
          address: address,
          api_key: GOONG_API_KEY,
        },
      });

      if (response.data.status === 'OK' && 
          response.data.results && 
          response.data.results.length > 0) {
        
        const firstResult = response.data.results[0];
        const location = firstResult.geometry.location;
        
        this.logger.log(
          `✅ Geocoded "${address}" → ${location.lat}, ${location.lng}`,
        );

        return {
          lat: location.lat,
          lng: location.lng,
        };
      }

      this.logger.warn(`No results found for address: ${address}`);
      return null;
    } catch (error) {
      this.logger.error(`Error geocoding address "${address}": ${error.message}`);
      return null;
    }
  }
}

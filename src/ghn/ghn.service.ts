import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CreateGhnOrderDto } from './dto/create-ghn-order.dto';

export interface GhnWard {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

export interface GhnOrderResponse {
  code: number;
  message: string;
  data: {
    order_code: string;
    sort_code: string;
    trans_type: string;
    ward_encode: string;
    district_encode: string;
    fee: {
      main_service: number;
      insurance: number;
      station_do: number;
      station_pu: number;
      return: number;
      r2s: number;
      coupon: number;
      total: number;
    };
    total_fee: number;
    expected_delivery_time: string;
  };
}

@Injectable()
export class GhnService {
  private readonly logger = new Logger(GhnService.name);
  private readonly baseUrl =
    'https://dev-online-gateway.ghn.vn/shiip/public-api';
  private readonly token: string;
  private readonly shopId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('GHN_TOKEN') || '';
    this.shopId = this.configService.get<string>('GHN_SHOP_ID', '885'); // Default shop ID from example

    if (!this.token) {
      this.logger.warn('⚠️ GHN_TOKEN not configured in environment variables');
    }
  }

  /**
   * Get list of wards by district ID
   */
  async getWards(districtId: number): Promise<GhnWard[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/master-data/ward`, {
          params: { district_id: districtId },
          headers: {
            Token: this.token,
            'Content-Type': 'application/json',
          },
        }),
      );

      return (response.data as any)?.data || [];
    } catch (error: any) {
      this.logger.error(
        `Failed to get wards for district ${districtId}:`,
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to fetch ward data from GHN');
    }
  }

  /**
   * Create shipping order with GHN
   */
  async createShippingOrder(dto: CreateGhnOrderDto): Promise<GhnOrderResponse> {
    try {
      const payload = {
        payment_type_id: dto.paymentTypeId,
        note: dto.note,
        required_note: dto.requiredNote || 'KHONGCHOXEMHANG',
        return_phone: dto.returnPhone,
        return_address: dto.returnAddress,
        return_district_id: dto.returnDistrictId,
        return_ward_code: dto.returnWardCode || '',
        client_order_code: dto.clientOrderCode || '',
        to_name: dto.toName,
        to_phone: dto.toPhone,
        to_address: dto.toAddress,
        to_ward_code: dto.toWardCode,
        to_district_id: dto.toDistrictId,
        cod_amount: dto.codAmount,
        content: dto.content,
        weight: dto.weight,
        length: dto.length,
        width: dto.width,
        height: dto.height,
        pick_station_id: dto.pickStationId,
        deliver_station_id: dto.deliverStationId,
        insurance_value: dto.insuranceValue,
        service_id: dto.serviceId || 0,
        service_type_id: dto.serviceTypeId || 2,
        coupon: dto.coupon,
        pick_shift: dto.pickShift || [2],
        items: dto.items,
      };

      this.logger.log(`📦 Creating GHN order for: ${dto.toName}`);

      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/shipping-order/create`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              Token: this.token,
              ShopId: this.shopId,
            },
          },
        ),
      );

      const responseData = response.data as any;
      if (responseData.code === 200) {
        this.logger.log(
          `✅ GHN order created: ${responseData.data.order_code}`,
        );
        return responseData;
      } else {
        throw new BadRequestException(
          responseData.message || 'GHN order creation failed',
        );
      }
    } catch (error: any) {
      this.logger.error(
        'Failed to create GHN order:',
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        error.response?.data?.message ||
          'Failed to create shipping order with GHN',
      );
    }
  }

  /**
   * Calculate shipping fee (can be implemented if needed)
   */
  async calculateShippingFee(params: {
    toDistrictId: number;
    toWardCode: string;
    weight: number;
    serviceTypeId?: number;
  }): Promise<number> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/shipping-order/fee`,
          {
            service_type_id: params.serviceTypeId || 2,
            to_district_id: params.toDistrictId,
            to_ward_code: params.toWardCode,
            weight: params.weight,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Token: this.token,
              ShopId: this.shopId,
            },
          },
        ),
      );

      return (response.data as any)?.data?.total || 0;
    } catch (error: any) {
      this.logger.error(
        'Failed to calculate shipping fee:',
        error.response?.data || error.message,
      );
      return 0;
    }
  }

  /**
   * Get order info from GHN
   */
  async getOrderInfo(orderCode: string): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/v2/shipping-order/detail`,
          { order_code: orderCode },
          {
            headers: {
              'Content-Type': 'application/json',
              Token: this.token,
              ShopId: this.shopId,
            },
          },
        ),
      );

      return (response.data as any)?.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to get GHN order info for ${orderCode}:`,
        error.response?.data || error.message,
      );
      throw new BadRequestException(
        'Failed to fetch order information from GHN',
      );
    }
  }
}

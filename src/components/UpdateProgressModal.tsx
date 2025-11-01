import React, { useState, useEffect } from 'react';
import { MerchantWithStatus } from '../types/merchant';
import { CONFIG } from '../config';
import PasscodeModal from './PasscodeModal';
import './UpdateProgressModal.css';

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: MerchantWithStatus[];
  onUpdateComplete: () => void;
}

interface UpdateResult {
  merchantId: number;
  merchantName: string;
  storeId: string;
  success: boolean;
  message: string;
  updated?: boolean; // true nếu đã update lastInteractionDate
}

const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  isOpen,
  onClose,
  merchants,
  onUpdateComplete,
}) => {
  const [showPasscode, setShowPasscode] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [shouldStop, setShouldStop] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentMerchant, setCurrentMerchant] = useState<string>('');
  const [results, setResults] = useState<UpdateResult[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [totalMerchants, setTotalMerchants] = useState<number>(0);
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setShowPasscode(true);
      setProgress(0);
      setResults([]);
      setErrors([]);
      setCurrentMerchant('');
      setIsUpdating(false);
      setShouldStop(false);
      setTotalMerchants(0);
      setCurrentIndex(0);
    }
  }, [isOpen]);

  const handlePasscodeSuccess = () => {
    setShowPasscode(false);
    setShouldStop(false);
    startUpdate();
  };

  const handleStop = () => {
    setShouldStop(true);
  };

  const handlePasscodeClose = () => {
    if (!isUpdating) {
      setShowPasscode(false);
      onClose();
    }
  };

  const startUpdate = async () => {
    setIsUpdating(true);
    setShouldStop(false);
    setProgress(0);
    setResults([]);
    setErrors([]);
    setCurrentIndex(0);

    // Filter merchants có storeId
    const merchantsWithStoreId = merchants.filter(m => m.storeId && m.storeId.trim() !== '');
    const total = merchantsWithStoreId.length;
    setTotalMerchants(total);

    if (total === 0) {
      setErrors(['Không có merchant nào có Store ID để cập nhật.']);
      setIsUpdating(false);
      return;
    }

    const updateResults: UpdateResult[] = [];

    for (let i = 0; i < merchantsWithStoreId.length; i++) {
      // Kiểm tra nếu user muốn dừng trước mỗi iteration
      if (shouldStop) {
        setErrors(prev => [...prev, 'Đã dừng cập nhật theo yêu cầu người dùng.']);
        break;
      }

      const merchant = merchantsWithStoreId[i];
      setCurrentIndex(i + 1);
      setCurrentMerchant(`${merchant.name} (${merchant.storeId})`);
      
      // Update progress trước khi xử lý
      const progressValue = ((i + 1) / total) * 100;
      setProgress(progressValue);

      try {
        const result = await updateMerchantLastInteraction(merchant);
        updateResults.push(result);
        
        // Update results ngay lập tức để hiển thị
        setResults([...updateResults]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorResult = {
          merchantId: merchant.id!,
          merchantName: merchant.name,
          storeId: merchant.storeId || '',
          success: false,
          message: errorMessage,
        };
        updateResults.push(errorResult);
        setResults([...updateResults]);
        setErrors(prev => [...prev, `${merchant.name}: ${errorMessage}`]);
      }

      // Delay nhỏ để tránh spam API
      if (i < merchantsWithStoreId.length - 1 && !shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setResults(updateResults);
    setIsUpdating(false);
    setShouldStop(false);
    setCurrentMerchant('');

    // Tự động đóng sau 3 giây nếu không có lỗi và không bị dừng
    if (!shouldStop) {
      const hasErrors = updateResults.some(r => !r.success);
      if (!hasErrors) {
        setTimeout(() => {
          onUpdateComplete();
          onClose();
        }, 3000);
      }
    }
  };

  const updateMerchantLastInteraction = async (merchant: MerchantWithStatus): Promise<UpdateResult> => {
    if (!merchant.storeId) {
      return {
        merchantId: merchant.id!,
        merchantName: merchant.name,
        storeId: '',
        success: false,
        message: 'Store ID không tồn tại',
      };
    }

    try {
      // Dynamic import để tránh circular dependency
      const transactionService = (await import('../services/transactionService')).default;
      const apiService = (await import('../services/apiService')).default;

      // Gọi API transaction
      const transactionResponse = await transactionService.getTransactionByStoreCode(merchant.storeId);
      
      // Lấy date từ transaction đầu tiên
      const latestDate = transactionService.getLatestTransactionDate(transactionResponse);
      
      if (!latestDate) {
        return {
          merchantId: merchant.id!,
          merchantName: merchant.name,
          storeId: merchant.storeId,
          success: true,
          message: 'Không có transaction nào',
          updated: false,
        };
      }

      // So sánh với lastInteractionDate hiện tại
      const currentDate = merchant.lastInteractionDate;
      const isNewer = transactionService.isDateNewer(latestDate, currentDate);

      if (!isNewer) {
        return {
          merchantId: merchant.id!,
          merchantName: merchant.name,
          storeId: merchant.storeId,
          success: true,
          message: `Date mới nhất (${latestDate}) không mới hơn date hiện tại (${currentDate})`,
          updated: false,
        };
      }

      // Update merchant với lastInteractionDate mới
      const updateData = {
        name: merchant.name,
        storeId: merchant.storeId,
        address: merchant.address,
        street: merchant.street,
        area: merchant.area,
        state: merchant.state,
        zipcode: merchant.zipcode,
        lastInteractionDate: latestDate,
        platform: merchant.platform,
        phone: merchant.phone,
      };

      await apiService.updateMerchant(merchant.id!, updateData, 'system');

      return {
        merchantId: merchant.id!,
        merchantName: merchant.name,
        storeId: merchant.storeId,
        success: true,
        message: `Đã cập nhật từ ${currentDate} sang ${latestDate}`,
        updated: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        merchantId: merchant.id!,
        merchantName: merchant.name,
        storeId: merchant.storeId,
        success: false,
        message: errorMessage,
      };
    }
  };

  if (!isOpen) return null;

  const successCount = results.filter(r => r.success && r.updated).length;
  const skippedCount = results.filter(r => r.success && !r.updated).length;
  const errorCount = results.filter(r => !r.success).length;

  // Chỉ hiển thị PasscodeModal khi cần, không hiển thị UpdateProgressModal lúc này
  if (showPasscode) {
    return (
      <PasscodeModal
        isOpen={showPasscode}
        onClose={handlePasscodeClose}
        onSuccess={handlePasscodeSuccess}
        title="Confirm to update all merchants"
      />
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content update-progress-modal">
        <div className="modal-header">
          <h2>Cập nhật Last Interaction Date</h2>
          {!isUpdating && (
            <button className="close-button" onClick={onClose}>
              ×
            </button>
          )}
        </div>

        <div className="modal-body">
          {isUpdating ? (
            <div className="progress-section">
              <div className="progress-info">
                <p>
                  <strong>Đang xử lý:</strong> {currentMerchant || 'Đang khởi tạo...'}
                </p>
                <p className="progress-status">
                  {currentIndex > 0 && totalMerchants > 0 
                    ? `${currentIndex} / ${totalMerchants} merchants`
                    : 'Đang chuẩn bị...'}
                </p>
                <div className="progress-bar-container">
                  <div className="progress-bar" style={{ width: `${Math.max(progress, 0)}%` }}></div>
                </div>
                <p className="progress-text">
                  {Math.max(Math.round(progress), 0)}% hoàn thành
                  {shouldStop && ' (Đang dừng...)'}
                </p>
              </div>
            </div>
          ) : results.length > 0 ? (
              <div className="results-section">
                <div className="results-summary">
                  <div className="summary-item success">
                    <span className="summary-label">Thành công:</span>
                    <span className="summary-value">{successCount}</span>
                  </div>
                  <div className="summary-item skipped">
                    <span className="summary-label">Bỏ qua:</span>
                    <span className="summary-value">{skippedCount}</span>
                  </div>
                  <div className="summary-item error">
                    <span className="summary-label">Lỗi:</span>
                    <span className="summary-value">{errorCount}</span>
                  </div>
                </div>

                {results.length > 0 && (
                  <div className="results-list">
                    <h4>Chi tiết:</h4>
                    <div className="results-scroll">
                      {results.map((result, index) => (
                        <div key={index} className={`result-item ${result.success ? (result.updated ? 'success' : 'skipped') : 'error'}`}>
                          <div className="result-merchant">
                            <strong>{result.merchantName}</strong> ({result.storeId})
                          </div>
                          <div className="result-message">{result.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="info-section">
                <p>Sẽ cập nhật Last Interaction Date cho tất cả merchants có Store ID.</p>
                <p>Chỉ cập nhật nếu date từ transaction mới hơn date hiện tại.</p>
              </div>
            )}

            {errors.length > 0 && (
              <div className="errors-section">
                <h4>Lỗi:</h4>
                <ul>
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="modal-actions">
            {isUpdating ? (
              <button 
                className="btn-stop" 
                onClick={handleStop}
                disabled={shouldStop}
              >
                {shouldStop ? 'Đang dừng...' : 'Dừng'}
              </button>
            ) : (
              <>
                <button className="btn-secondary" onClick={onClose}>
                  Đóng
                </button>
                {results.length > 0 && (
                  <button className="btn-primary" onClick={() => { onUpdateComplete(); onClose(); }}>
                    Hoàn tất
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
  );
};

export default UpdateProgressModal;


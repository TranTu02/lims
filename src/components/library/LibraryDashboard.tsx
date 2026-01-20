import { useState, useMemo } from "react";
import { Search, Plus, FileText, X, ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import type { Matrix, Parameter, Protocol } from "@/types/library";
import { mockMatrices, mockParameters, mockProtocols } from "@/types/mockdata";

interface ParameterWithMatrices extends Parameter {
    matrices: Matrix[];
    parameterNameEn?: string; // Add if missing in base type but used in UI
    parameterGroup?: string; // Add if missing in base type
}

// Since Parameter in library.ts might miss some UI specific fields used in the original mocks,
// we ensure we handle them. Looking at library.ts:
// Parameter has parameterId, parameterName, displayStyle, technicianAlias.
// Original mock had: code, name, nameEn, group, displayStyle, technicianAlias, matrices.
// We'll trust the centralized type but might need to adapt if properties are missing.
// The centralized mock data might also affect this.
// Let's assume mockParameters in mockdata.ts has the structure defined in library.ts.

export function LibraryDashboard({ viewType }: { viewType: "parameters" | "protocols" }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<string>("all");
    const [selectedParameter, setSelectedParameter] = useState<ParameterWithMatrices | null>(null);
    const [protocolToView, setProtocolToView] = useState<Protocol | null>(null);
    const [expandedMatrix, setExpandedMatrix] = useState<string | null>(null);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Join Parameters with Matrices for the UI
    const detailedParameters: ParameterWithMatrices[] = useMemo(() => {
        return mockParameters.map((p) => {
            // Find matrices for this parameter
            const relatedMatrices = mockMatrices.filter((m) => m.parameterId === p.parameterId);
            // Some UI fields might be missing in the strict type, we can derive or mock them if needed
            // But relying on what's available in mockdata.ts is best.
            // If parameterGroup is missing in Parameter type, we might check if we can get it from somewhere else
            // or just leave it empty.
            // For now, let's cast or assume properties exist or handle their absence.
            return {
                ...p,
                matrices: relatedMatrices,
                // Mocking group/en name if they don't exist in the type yet
                parameterGroup: (p as any).parameterGroup || "General",
                parameterNameEn: (p as any).parameterNameEn || p.parameterName,
            };
        });
    }, []);

    const groups = ["all", ...Array.from(new Set(detailedParameters.map((p) => p.parameterGroup)))];

    const filteredParameters = detailedParameters.filter((param) => {
        const matchesSearch = param.parameterName.toLowerCase().includes(searchTerm.toLowerCase()) || (param.parameterNameEn && param.parameterNameEn.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesGroup = selectedGroup === "all" || param.parameterGroup === selectedGroup;
        return matchesSearch && matchesGroup;
    });

    const filteredProtocols = mockProtocols.filter((protocol) => {
        const matchesSearch =
            protocol.protocolCode.toLowerCase().includes(searchTerm.toLowerCase()) || (protocol.protocolName && protocol.protocolName.toLowerCase().includes(searchTerm.toLowerCase()));
        // Note: protocolGroup is new, might need check
        return matchesSearch;
    });

    // Calculate pagination
    const totalItems = viewType === "parameters" ? filteredParameters.length : filteredProtocols.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedParameters = filteredParameters.slice(startIndex, endIndex);
    const paginatedProtocols = filteredProtocols.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (items: number) => {
        setCurrentPage(1);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Header & Filters */}
            <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">{viewType === "parameters" ? "Danh sách chỉ tiêu" : "Danh sách phương pháp"}</h1>
                        <p className="text-sm text-gray-600 mt-0.5">
                            {viewType === "parameters" ? `Tổng số: ${filteredParameters.length} chỉ tiêu` : `Tổng số: ${filteredProtocols.length} phương pháp`}
                        </p>
                    </div>
                    <Button size="sm" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm mới
                    </Button>
                </div>

                {/* Search & Filter */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder={viewType === "parameters" ? "Tìm kiếm chỉ tiêu..." : "Tìm kiếm phương pháp..."}
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10"
                        />
                    </div>

                    {viewType === "parameters" && (
                        <select
                            value={selectedGroup}
                            onChange={(e) => {
                                setSelectedGroup(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Tất cả nhóm</option>
                            {groups.slice(1).map((group) => (
                                <option key={group} value={group}>
                                    {group}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
            </div>

            {/* Content */}
            {viewType === "parameters" ? (
                <div className="flex gap-4">
                    {/* Parameters List */}
                    <div className="flex-1 bg-white rounded-lg border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[600px]">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên chỉ tiêu</th>
                                        {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên tiếng Anh</th> */}
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhóm</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng Matrix</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {paginatedParameters.map((param) => (
                                        <tr
                                            key={param.parameterId}
                                            onClick={() => setSelectedParameter(param)}
                                            className={`hover:bg-gray-50 cursor-pointer ${selectedParameter?.parameterId === param.parameterId ? "bg-blue-50" : ""}`}
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{param.parameterId}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                <div>{param.parameterName}</div>
                                                {param.parameterNameEn && <div className="text-xs text-gray-500">{param.parameterNameEn}</div>}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="secondary" className="text-xs">
                                                    {param.parameterGroup}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{param.matrices.length}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="border-t p-3">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                itemsPerPage={itemsPerPage}
                                totalItems={totalItems}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                            />
                        </div>
                    </div>

                    {/* Parameter Detail */}
                    {selectedParameter && (
                        <div className="w-96 bg-white rounded-lg border p-4 space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">{selectedParameter.parameterName}</h3>
                                <p className="text-sm text-gray-600 mt-0.5">{selectedParameter.parameterNameEn}</p>
                                <div className="mt-2 flex gap-2">
                                    <Badge variant="secondary">{selectedParameter.parameterGroup}</Badge>
                                    <Badge variant="outline">{selectedParameter.parameterId}</Badge>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Matrices ({selectedParameter.matrices.length})</div>
                                <div className="space-y-2">
                                    {selectedParameter.matrices.map((matrix) => (
                                        <div key={matrix.matrixId} className="border rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => setExpandedMatrix(expandedMatrix === matrix.matrixId ? null : matrix.matrixId)}
                                                className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                                            >
                                                <div className="text-left">
                                                    <div className="text-sm font-medium text-gray-900">{matrix.sampleTypeName}</div>
                                                </div>
                                                {expandedMatrix === matrix.matrixId ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                                            </button>
                                            {expandedMatrix === matrix.matrixId && (
                                                <div className="px-3 py-2 space-y-2 bg-white border-t">
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div>
                                                            <div className="text-gray-500">Mã Matrix</div>
                                                            <div className="font-medium text-gray-900">{matrix.matrixId}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">Phí sau thuế</div>
                                                            <div className="font-medium text-gray-900">{matrix.feeAfterTax.toLocaleString("vi-VN")} đ</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">LOD</div>
                                                            <div className="font-medium text-gray-900">{matrix.LOD || "-"}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-gray-500">LOQ</div>
                                                            <div className="font-medium text-gray-900">{matrix.LOQ || "-"}</div>
                                                        </div>
                                                    </div>
                                                    <div className="pt-2 border-t">
                                                        <button
                                                            onClick={() => {
                                                                const protocol = mockProtocols.find((p) => p.protocolCode === matrix.protocolCode);
                                                                if (protocol) setProtocolToView(protocol);
                                                            }}
                                                            className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                                        >
                                                            <FileText className="h-3 w-3" />
                                                            {matrix.protocolCode}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Protocols Table */
                <div className="bg-white rounded-lg border overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead className="bg-gray-50 border-b">
                                <tr className="divide-x divide-gray-200">
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã phương pháp</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên phương pháp</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nhóm</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian thực hiện</th>
                                    {/* <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số file đính kèm</th> */}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {paginatedProtocols.map((protocol) => (
                                    <tr key={protocol.protocolId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{protocol.protocolCode}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-gray-900">{protocol.protocolName}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">{protocol.description}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="secondary" className="text-xs">
                                                {protocol.protocolGroup}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{protocol.executionTime}</td>
                                        {/* <td className="px-4 py-3 text-sm text-gray-600">{protocol.relatedFiles?.length || 0} file</td> */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Xem chi tiết" onClick={() => setProtocolToView(protocol)}>
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="border-t p-3">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            itemsPerPage={itemsPerPage}
                            totalItems={totalItems}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                        />
                    </div>
                </div>
            )}

            {/* Protocol Detail Modal */}
            {protocolToView && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{protocolToView.protocolName}</h2>
                                <p className="text-sm text-gray-600 mt-0.5">{protocolToView.protocolCode}</p>
                            </div>
                            <button onClick={() => setProtocolToView(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Thông tin chung</div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-500">Nhóm phương pháp</div>
                                        <Badge variant="secondary" className="mt-1">
                                            {protocolToView.protocolGroup}
                                        </Badge>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-500">Thời gian thực hiện</div>
                                        <div className="text-sm text-gray-900 mt-1">{protocolToView.executionTime}</div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="text-sm font-medium text-gray-700 mb-2">Mô tả</div>
                                <p className="text-sm text-gray-600">{protocolToView.description}</p>
                            </div>

                            {protocolToView.executionGuide && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">Hướng dẫn thực hiện</div>
                                    <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg">{protocolToView.executionGuide}</div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-6">
                                {protocolToView.equipment && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Thiết bị cần thiết</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {protocolToView.equipment.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {protocolToView.chemicals && (
                                    <div>
                                        <div className="text-sm font-medium text-gray-700 mb-2">Hóa chất</div>
                                        <ul className="text-sm text-gray-600 space-y-1">
                                            {protocolToView.chemicals.map((item, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="text-gray-400">•</span>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Related files would go here if/when added to type */}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

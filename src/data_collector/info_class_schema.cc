#include <memory>
#include <utility>
#include <vector>

#include "src/common/macros.h"

#include "src/data_collector/data_collector_table.h"
#include "src/data_collector/info_class_schema.h"
#include "src/data_collector/source_connector.h"

namespace pl {
namespace datacollector {

std::atomic<uint64_t> InfoClassSchema::global_id_ = 0;

// TODO(oazizi): Move this into the DataType class?
size_t InfoClassElement::WidthBytes() const {
  switch (type_) {
    case DataType::FLOAT64:
      return (sizeof(double));
    case DataType::INT64:
      return (sizeof(int64_t));
    default:
      CHECK(0) << "Unknown data type";
  }
}

datacollectorpb::Element InfoClassElement::ToProto() const {
  datacollectorpb::Element element_proto;
  element_proto.set_name(name_);
  element_proto.set_state(state_);
  element_proto.set_type(type_);
  return element_proto;
}

// Add an element to the Info Class.
Status InfoClassSchema::AddElement(const std::string& name, DataType type, Element_State state) {
  elements_.push_back(InfoClassElement(name, type, state));

  return Status::OK();
}

void* InfoClassSchema::GetData() {
  sampling_count_++;
  last_sampled_ = std::chrono::duration_cast<std::chrono::milliseconds>(
      std::chrono::system_clock::now().time_since_epoch());

  return source_->GetData();
}

datacollectorpb::InfoClass InfoClassSchema::ToProto() const {
  datacollectorpb::InfoClass info_class_proto;
  // Populate the proto with Elements.
  for (auto element : elements_) {
    datacollectorpb::Element* element_proto_ptr = info_class_proto.add_elements();
    element_proto_ptr->MergeFrom(element.ToProto());
  }

  // Add metadata.
  // TODO(kgandhi): For M2, only add the source name. Later on add other information
  // from the SourceConnector.
  auto metadata_map = info_class_proto.mutable_metadata();
  std::string key = "source";
  std::string value = source_->name();
  (*metadata_map)[key] = value;

  // Add all the other fields for the proto.
  info_class_proto.set_name(name_);
  info_class_proto.set_id(id_);

  return info_class_proto;
}

}  // namespace datacollector
}  // namespace pl

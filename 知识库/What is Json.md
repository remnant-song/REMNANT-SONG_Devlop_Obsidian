[What is Json?-CSDN博客](https://lvynote.blog.csdn.net/article/details/145291977)

#### **Comprehensive Notes on JSON**

---

#### **Introduction**

With the growth of the internet and interconnected systems, the need for efficient data exchange has become increasingly important. JSON (JavaScript Object Notation) has emerged as a lightweight, human- and machine-readable data format that facilitates platform-independent communication between systems, particularly in web-based environments. Below is an in-depth exploration of JSON, covering its structure, advantages, applications, and comparisons with other technologies.

---

#### **Contents**

1. **What is JSON?**
2. **How Does JSON Work?**
3. **What is a JSON Node?**
4. **What are the Advantages of JSON?**
5. **Relation Between JSON and Java**
6. **Applications and Practical Benefits**
7. **JSON in Industry**
8. **Devices and Services**
9. **JSON vs XML**
10. **JSON and MQTT**
11. **JSON and NoSQL**
12. **Example of JSON**
13. **Simple JSON Communication in Practice**

---

#### **1. What is JSON?**

JSON is a lightweight data format used for exchanging data between systems. Although it originates from JavaScript (as defined in the ECMA-262 standard), JSON is language-independent and universally supported by programming languages. Key characteristics of JSON include:

- **Platform Independence**: Works seamlessly across different systems.
- **Human-Readable**: Simple syntax that is easy to understand and debug.
- **File Format**: JSON files typically have the extension `.json`.

##### **Basic Structure**

JSON documents are structured in a simple, object-oriented manner:

- A JSON document begins and ends with curly braces `{}`.
- Inside, data is represented as key-value pairs.
- Keys are strings, and values can be of various types (e.g., string, number, array).

Example:

```json
{
  "name": "Alice",
  "age": 25,
  "isStudent": false,
  "subjects": ["Math", "Science", "English"]
}
```

---

#### **2. How Does JSON Work?**

A JSON document adheres to strict structural rules defined by Douglas Crockford in the JSON specification. These rules include:

1. **Object Representation**: Curly braces `{}` encapsulate key-value pairs.
2. **Arrays**: Square brackets `[]` represent ordered lists of values.
3. **Key-Value Pairs**: Keys are strings followed by a colon (`:`), with values that can be:
    - Boolean: `true` or `false`
    - Number: Integer, float, or scientific notation
    - String: Text enclosed in double quotes
    - Null: Representing an empty or null value
    - Object: Another JSON object
    - Array: A list of values

##### **Example Structure**

```json
{
  "field1": "Value",
  "field2": {
    "subField1": 123,
    "subField2": ["Value1", "Value2"]
  }
}
```

#### **Tip**

Tools like [jsonformatter.org](https://jsonformatter.org/) can  be used to validate, format, and convert JSON.

---

#### **3. What is a JSON Node?**

A JSON node represents an individual element in a JSON document. Each node has a unique path based on its position in the JSON structure.

##### **Example**

```json
{
  "name": "screws",
  "item_number": 1001,
  "order": {
    "order_number": 10013,
    "date": "01.01.2023",
    "quantity": 30
  }
}
```

- Nodes: `name`, `item_number`, `order`, `order.order_number`, etc.
- Paths: The hierarchy (e.g., `order.order_number`) indicates the node’s position.

---

#### **4. What are the Advantages of JSON?**

JSON offers several benefits that make it a popular choice for data exchange:

1. **Ease of Learning and Use**: Minimal training required.
2. **Widespread Compatibility**: Supported by most programming languages through parsers.
3. **Human-Readable**: Its simple syntax allows easy debugging.
4. **Platform-Independent**: Works seamlessly across different systems and environments.

##### **Practical Use**

JSON’s simplicity enables rapid integration into projects. Tools like the OPC Router allow drag-and-drop connections to systems using JSON.

---

#### **5. Relation Between JSON and Java**

JSON’s origin lies in JavaScript, but it is not restricted to JavaScript environments. Key points:

- Built-in functions in JavaScript make JSON handling intuitive.
- JSON is entirely independent and supported in languages like Python, Java, C#, etc.
- In Java, libraries like `Jackson` or `Gson` provide robust JSON handling capabilities.

---

#### **6. Applications and Practical Benefits**

JSON’s simplified structure and Unicode encoding make it ideal for:

1. **Data Exchange**: Transmitting data between systems (HTTP, file transfer, databases, etc.).
2. **Asynchronous Processing**: Its “closed packet” format is suitable for processes that don’t require immediate responses.
3. **Web and IoT**: Widely used in APIs, IoT devices, and cloud computing.

---

#### **7. JSON in Industry**

JSON has gained traction in industrial applications due to:

- **Integration with REST APIs**: Used for communication between devices and web-based services.
- **IoT**: Lightweight and versatile, making it suitable for resource-constrained devices.
- **Machine Learning**: Serves as a flexible format for feeding data into AI systems.

---

#### **8. Devices and Services**

Many modern devices and services use JSON for data exchange:

- **REST APIs**: Frequently return JSON data (e.g., OpenWeatherMap API).
- **IoT Devices**: Send data in JSON format via protocols like MQTT.

---

#### **9. JSON vs XML**

|**Aspect**|**JSON**|**XML**|
|---|---|---|
|**Readability**|More human-readable|Verbose and less readable|
|**Flexibility**|No predefined schema required|Requires a predefined schema|
|**Efficiency**|Lightweight|Larger file sizes|
|**Use Case**|Ideal for flexible, lightweight data|Suited for well-defined data structures|

---

#### **10. JSON and MQTT**

MQTT, a lightweight protocol for constrained devices, often uses JSON for payload formatting due to its simplicity and compatibility with IoT systems.

---

#### **11. JSON and NoSQL**

NoSQL databases (e.g., MongoDB) frequently use JSON for:

- **Document Storage**: JSON documents are stored and retrieved without schema constraints.
- **Flexible Queries**: Query fields and objects without requiring a schema.

---

#### **12. Example of JSON**

A production order with components can be represented as:

```json
{
  "order_number": 4711,
  "quantity": 15000,
  "item": "Product A",
  "planned_date": "2025-01-21",
  "release": true,
  "components": [
    {
      "name": "Component A",
      "material_number": 292345,
      "quantity": 345.123,
      "storage_areas": [3, 6, 23]
    },
    {
      "name": "Component B",
      "material_number": 908431,
      "quantity": 12034.123,
      "storage_areas": [1, 2, 9]
    }
  ]
}
```

---

#### **13. Simple JSON Communication in Practice**

JSON is a widely adopted standard for transmitting parameters in systems:

- Systems like SAP or SQL can output data in JSON format for easy integration.
- JSON plays a vital role in Industry 4.0, enabling seamless communication across devices and systems.

---

#### **Conclusion**

JSON’s simplicity, versatility, and language independence make it a cornerstone of modern data exchange. From web APIs to industrial IoT systems, JSON enables efficient communication and data processing, ensuring its relevance in an increasingly connected world.

---

笔记整理，参考文章：[什么是 JSON？](https://www.opc-router.com/what-is-json/)

## 笔记翻译

---

#### **简介**

随着互联网和计算机系统互联的不断发展，高效的数据交换需求变得越来越重要。JSON（JavaScript Object Notation）作为一种轻量级、可读性强的数据格式，能够实现系统间的跨平台通信，特别是在基于 Web 的环境中应用广泛。以下是对 JSON 的结构、优点、应用及其与其他技术对比的详细解析。

---

#### **目录**

1. **什么是 JSON？**
2. **JSON 的工作原理**
3. **什么是 JSON 节点？**
4. **JSON 的优点**
5. **JSON 与 Java 的关系**
6. **JSON 的应用领域和实际好处**
7. **JSON 在工业中的应用**
8. **设备与服务**
9. **JSON 与 XML 的对比**
10. **JSON 与 MQTT**
11. **JSON 与 NoSQL**
12. **JSON 示例**
13. **JSON 在实际中的简单通信**

---

#### **1. 什么是 JSON？**

JSON 是一种用于系统间数据交换的轻量级数据格式。虽然它起源于 JavaScript（由 ECMA-262 标准定义），但 JSON 是独立于语言的，几乎所有的编程语言都支持它。JSON 的主要特点包括：

- **平台独立性**：可在不同系统之间无缝运行。
- **可读性强**：简单的语法便于理解和调试。
- **文件格式**：JSON 文件通常以 `.json` 为扩展名。

##### **基本结构**

JSON 文档以简单的面向对象结构表示：

- JSON 文档以 `{}` 包裹。
- 内部数据以键值对（key-value）形式表示。
- 键是字符串，值可以是多种类型（如字符串、数字、数组等）。

示例：

```json
{
  "name": "Alice",
  "age": 25,
  "isStudent": false,
  "subjects": ["Math", "Science", "English"]
}
```

---

#### **2. JSON 的工作原理**

JSON 文档遵循 Douglas Crockford 制定的严格结构规则。主要规则如下：

1. **对象表示**：使用 `{}` 包裹键值对。
2. **数组表示**：使用 `[]` 表示值的有序列表。
3. **键值对**：键是字符串，后跟冒号（`:`），值可以是：
    - 布尔值：`true` 或 `false`
    - 数字：整数、浮点数或科学计数法
    - 字符串：用双引号括起的文本
    - 空值：表示一个空变量
    - 对象：嵌套的 JSON 对象
    - 数组：值的有序集合

##### **结构示例**

```json
{
  "field1": "Value",
  "field2": {
    "subField1": 123,
    "subField2": ["Value1", "Value2"]
  }
}
```

#### **提示**

可以使用 [jsonformatter.org](https://jsonformatter.org/) 工具验证、格式化和转换 JSON。

---

#### **3. 什么是 JSON 节点？**

JSON 节点是 JSON 文档中表示的一个具体元素。每个节点都有一个唯一的路径，用于表示其在 JSON 结构中的位置。

##### **示例**

```json
{
  "name": "screws",
  "item_number": 1001,
  "order": {
    "order_number": 10013,
    "date": "01.01.2023",
    "quantity": 30
  }
}
```

- 节点：`name`、`item_number`、`order`、`order.order_number` 等。
- 路径：层级路径（如 `order.order_number`）表示节点的位置。

---

#### **4. JSON 的优点**

JSON 的以下优点使其成为数据交换的首选：

1. **易学易用**：学习成本低，上手快。
2. **兼容性广**：大多数编程语言都有解析器支持 JSON。
3. **可读性强**：简单语法便于调试。
4. **平台无关性**：可跨系统和环境使用。

##### **实际应用**

JSON 的简单性使其能够快速集成到项目中。使用 OPC Router 等工具可以通过拖放轻松连接 JSON。

---

#### **5. JSON 与 Java 的关系**

虽然 JSON 起源于 JavaScript，但它并不局限于 JavaScript 环境。关键点包括：

- JavaScript 提供了许多内置函数，便于操作 JSON。
- JSON 是完全独立的，支持 Python、Java、C# 等语言。
- 在 Java 中，可使用 `Jackson` 或 `Gson` 库轻松解析和生成 JSON。

---

#### **6. JSON 的应用领域和实际好处**

由于其简化的结构和 Unicode 编码，JSON 是一种理想的系统间数据交换格式。具体应用包括：

1. **数据交换**：通过 HTTP、文件传输、数据库等在系统间传递数据。
2. **异步处理**：JSON 的“封闭包”格式适用于无需即时响应的流程。
3. **Web 和物联网（IoT）**：广泛用于 API、IoT 设备和云计算。

---

#### **7. JSON 在工业中的应用**

JSON 在工业领域的应用日益增多，其主要原因是：

- **REST API 集成**：用于设备和基于 Web 的服务间通信。
- **物联网**：轻量级和灵活性使其适用于资源受限的设备。
- **机器学习**：作为数据传输的灵活格式，适合 AI 系统的数据输入。

---

#### **8. 设备与服务**

许多现代设备和服务使用 JSON 进行数据交换：

- **REST API**：许多 API 返回 JSON 数据（如 OpenWeatherMap API）。
- **IoT 设备**：通过协议（如 MQTT）以 JSON 格式发送数据。

---

#### **9. JSON 与 XML 的对比**

|**方面**|**JSON**|**XML**|
|---|---|---|
|**可读性**|更易读|语法复杂，冗长|
|**灵活性**|无需预定义模式|需要明确的结构定义|
|**效率**|文件轻量化|文件通常较大|
|**适用场景**|灵活数据交换|清晰定义的数据接口|

---

#### **10. JSON 与 MQTT**

MQTT 是一种轻量级的数据交换协议，常用于带宽和计算能力有限的设备。MQTT 的数据负载未规定格式，但 JSON 是其常用的格式，因其简单且易于解析。

---

#### **11. JSON 与 NoSQL**

NoSQL 数据库（如 MongoDB）广泛使用 JSON：

- **文档存储**：无需预定义模式，JSON 文档可直接存储和查询。
- **灵活查询**：无须架构定义即可访问字段和对象。

---

#### **12. JSON 示例**

以下是描述生产订单的 JSON 示例，其中包含多个组件：

```json
{
  "order_number": 4711,
  "quantity": 15000,
  "item": "Product A",
  "planned_date": "2025-01-21",
  "release": true,
  "components": [
    {
      "name": "Component A",
      "material_number": 292345,
      "quantity": 345.123,
      "storage_areas": [3, 6, 23]
    },
    {
      "name": "Component B",
      "material_number": 908431,
      "quantity": 12034.123,
      "storage_areas": [1, 2, 9]
    }
  ]
}
```

---

#### **13. JSON 在实际中的简单通信**

JSON 是一种受 JavaScript 影响但独立的数据传输标准。其简单性和易于与其他编程语言集成的特点，使 JSON 在工业中应用广泛。  
在实际中，JSON 常用于系统间参数的输入或输出。例如，生产订单可快速以 JSON 格式转发，从而优化流程。通过 OPC Router 等软件，系统（如 SAP、MQTT、OPC UA 和 SQL）可生成数据包并转换为 JSON 格式，在工业 4.0 数据交换中发挥重要作用。

---

#### **总结**

JSON 因其简单、灵活和语言无关的特性，已成为现代数据交换的重要基石。从 Web API 到工业 IoT 系统，JSON 支持高效通信和数据处理，确保其在不断互联的世界中具有持久的相关性。

## ==实验==

实现一个用于 JSON 序列化和反序列化的工具类 `JSON`。它依赖于 JSONCPP 库，提供了两个静态方法：`serialize` 和 `deserialize`，分别实现 JSON 数据的序列化和反序列化功能。  
下面是详细代码：

---

#### **头文件引用部分**

```cpp
#include <iostream>
#include <sstream>
#include <string>
#include <memory>
#include <jsoncpp/json/json.h>
```

1. **标准库头文件**
    
    - `<iostream>`：用于标准输入/输出流。
    - `<sstream>`：提供字符串流功能。
    - `<string>`：用于字符串操作。
    - `<memory>`：提供智能指针类（如 `std::unique_ptr`）。
2. **第三方库**
    
    - `<jsoncpp/json/json.h>`：JSONCPP 提供的 JSON 操作头文件，用于处理 JSON 数据。

---

#### **类定义和方法实现**

```cpp
class JSON
{
public:
    static bool serialize(const Json::Value &val, std::string &body);
    static bool deserialize(const std::string &body, Json::Value &val);
};
```

- **类 `JSON`**
    - 这是一个工具类，不需要实例化，因此所有方法都用 `static` 修饰。
    - 提供两个主要功能：
        - **序列化 (`serialize`)**：将 `Json::Value` 对象转换为字符串形式的 JSON。
        - **反序列化 (`deserialize`)**：将字符串形式的 JSON 转换为 `Json::Value` 对象。

---

##### **方法 1：序列化**

```cpp
static bool serialize(const Json::Value &val, std::string &body)
{
    std::stringstream ss;  // 用于存储序列化后的 JSON 数据。

    // 先实例化一个工厂类对象
    Json::StreamWriterBuilder swb;
    // 通过工厂类对象来生产派生类对象
    std::unique_ptr<Json::StreamWriter> w(swb.newStreamWriter());
    
    // 调用写方法，将 val 写入到字符串流中。
    bool ret = w->write(val, &ss);
    if (ret != 0)  // 判断写入是否成功
    {
        ELOG("json serialize failed!");  // 错误处理（假设 ELOG 是自定义日志宏）
        return false;
    }

    body = ss.str();  // 将字符串流内容赋值给 body
    return true;      // 返回成功
}
```

###### **详细步骤**

1. **初始化 `std::stringstream`**
    
    - 用于存储序列化结果。
2. **创建 JSON 写入器**
    
    - `Json::StreamWriterBuilder` 是 JSONCPP 提供的工厂类，用于创建 JSON 写入器对象。
    - `swb.newStreamWriter()` 返回一个 `StreamWriter` 派生类对象，用于将 JSON 数据写入流。
    - 用 `std::unique_ptr` 管理 `StreamWriter` 的生命周期，避免内存泄漏。
3. **写入 JSON 数据**
    
    - `w->write(val, &ss)` 将 `Json::Value` 类型的 `val` 写入到 `std::stringstream` 中。
4. **错误检查**
    
    - 如果写入失败（`ret != 0`），记录错误日志并返回 `false`。
5. **返回结果**
    
    - 将 `std::stringstream` 的内容存储到 `body` 中。
    - 返回 `true` 表示序列化成功。

---

##### **方法 2：反序列化**

```cpp
static bool deserialize(const std::string &body, Json::Value &val)
{
    Json::CharReaderBuilder crb;  // 创建 JSON 解析器工厂类
    std::unique_ptr<Json::CharReader> r(crb.newCharReader());  // 创建解析器实例

    std::string errs;  // 用于存储解析错误信息
    bool ret = r->parse(body.c_str(), body.c_str() + body.size(), &val, &errs);
    if (ret == false)  // 如果解析失败
    {
        ELOG("json deserialize failed : %s", errs.c_str());  // 打印错误信息
        return false;
    }

    return true;  // 返回成功
}
```

###### **详细步骤**

1. **创建 JSON 解析器**
    
    - 使用 `Json::CharReaderBuilder` 工厂类创建 JSON 解析器对象。
    - `newCharReader()` 返回一个 `CharReader` 派生类，用于解析 JSON 字符串。
2. **解析 JSON 字符串**
    
    - `r->parse(body.c_str(), body.c_str() + body.size(), &val, &errs)`：
        - 参数 `body.c_str()` 和 `body.c_str() + body.size()` 指定 JSON 数据的范围。
        - `&val` 是解析结果的存储位置（`Json::Value` 类型）。
        - `&errs` 用于存储解析时的错误信息。
3. **错误检查**
    
    - 如果解析失败（`ret == false`），记录错误日志并返回 `false`。
4. **返回结果**
    
    - 如果解析成功，返回 `true`。

---

#### **关键技术点**

1. **工厂模式**
    
    - `Json::StreamWriterBuilder` 和 `Json::CharReaderBuilder` 是工厂类，分别用于创建 `StreamWriter` 和 `CharReader` 的派生类对象。
2. **智能指针管理资源**
    
    - `std::unique_ptr` 确保动态分配的对象在超出作用域后自动释放，避免内存泄漏。
3. **错误处理**
    
    - 使用日志（如 `ELOG`）记录序列化和反序列化的失败原因。
4. **JSONCPP 库**
    
    - 该库提供了操作 JSON 数据的方便接口，包括 `Json::Value` 作为核心数据结构，以及工厂类生成的读写器用于处理字符串。

---

#### **代码适用场景**

1. **序列化**
    
    - 将应用程序中存储的结构化数据转换为 JSON 格式，便于网络传输或持久化存储。
2. **反序列化**
    
    - 将接收到的 JSON 数据解析成可操作的 `Json::Value` 对象，方便进一步处理。

#### **改进建议**

1. **异常安全性**
    
    - 可通过捕获异常进一步增强代码的健壮性，尤其是在资源分配和日志记录部分。
2. **日志模块抽象**
    
    - 使用更通用的日志工具替代 `ELOG`，如 `spdlog`，便于扩展。
3. **单元测试**
    
    - 为 `serialize` 和 `deserialize` 编写测试用例，确保在边界情况（如空字符串、非法 JSON 数据）下的稳定性。
#!/usr/bin/env python3
"""
Azure OpenAI 配置测试脚本
用于验证 Azure OpenAI 配置是否正确
"""

import os
import sys
from openai import AzureOpenAI
from langchain_openai import ChatOpenAI

def test_azure_openai_config():
    """测试 Azure OpenAI 配置"""
    print("🔍 测试 Azure OpenAI 配置")
    print("=" * 50)
    
    # 检查环境变量
    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT", 
        "AZURE_OPENAI_DEPLOYMENT_NAME"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ 缺少必需的环境变量:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\n请设置以下环境变量:")
        print("export AZURE_OPENAI_API_KEY='your_api_key'")
        print("export AZURE_OPENAI_ENDPOINT='https://your-resource.openai.azure.com/'")
        print("export AZURE_OPENAI_DEPLOYMENT_NAME='gpt-4o-mini'")
        return False
    
    # 显示配置信息
    print("✅ 环境变量配置:")
    print(f"   API Key: {os.getenv('AZURE_OPENAI_API_KEY')[:8]}...")
    print(f"   Endpoint: {os.getenv('AZURE_OPENAI_ENDPOINT')}")
    print(f"   Deployment: {os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')}")
    print(f"   API Version: {os.getenv('AZURE_OPENAI_API_VERSION', '2024-02-15-preview')}")
    
    try:
        # 测试 Azure OpenAI 客户端
        print("\n🧪 测试 Azure OpenAI 连接...")
        
        client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        
        # 测试简单请求
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            messages=[
                {"role": "user", "content": "Hello, this is a test message. Please respond with 'Test successful!'"}
            ],
            max_tokens=50
        )
        
        print("✅ Azure OpenAI 连接成功!")
        print(f"   响应: {response.choices[0].message.content}")
        
        # 测试 LangChain 集成
        print("\n🧪 测试 LangChain 集成...")
        
        model = ChatOpenAI(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
            temperature=0.1,
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            base_url=f"{os.getenv('AZURE_OPENAI_ENDPOINT')}openai/deployments/{os.getenv('AZURE_OPENAI_DEPLOYMENT_NAME')}/",
            default_query={"api-version": os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")}
        )
        
        # 测试 LangChain 调用
        from langchain_core.messages import HumanMessage
        response = model.invoke([HumanMessage(content="Hello from LangChain!")])
        
        print("✅ LangChain 集成成功!")
        print(f"   响应: {response.content}")
        
        return True
        
    except Exception as e:
        print(f"❌ 连接失败: {str(e)}")
        print("\n🔧 故障排除建议:")
        print("   1. 检查 Azure OpenAI 资源是否已正确创建")
        print("   2. 验证 API 密钥是否正确")
        print("   3. 确认端点 URL 格式是否正确")
        print("   4. 检查部署名称是否与 Azure 门户中的完全一致")
        print("   5. 确认 API 版本是否支持")
        return False

def main():
    """主函数"""
    print("Azure OpenAI 配置测试工具")
    print("=" * 50)
    
    # 检查是否在虚拟环境中
    if hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix):
        print("✅ 检测到虚拟环境")
    else:
        print("⚠️  建议在虚拟环境中运行此脚本")
    
    success = test_azure_openai_config()
    
    if success:
        print("\n🎉 所有测试通过! Azure OpenAI 配置正确.")
        print("您现在可以在项目中使用 Azure OpenAI 了.")
    else:
        print("\n❌ 配置测试失败，请检查上述建议.")
        sys.exit(1)

if __name__ == "__main__":
    main()

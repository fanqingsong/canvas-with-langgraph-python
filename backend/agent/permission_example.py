"""
权限检查示例
演示如何在 LangGraph Agent 中实现权限控制
"""

from auth import User, Permission, has_permission, get_user
from permission_agent import PermissionAwareAgent, can_access_tool, get_available_tools_for_user

def demonstrate_permission_system():
    """演示权限系统的工作原理"""
    
    print("=== 权限系统演示 ===\n")
    
    # 获取不同角色的用户
    admin_user = get_user("admin")
    editor_user = get_user("editor")
    viewer_user = get_user("viewer")
    guest_user = get_user("guest")
    
    users = [
        ("管理员", admin_user),
        ("编辑者", editor_user),
        ("查看者", viewer_user),
        ("访客", guest_user),
    ]
    
    # 演示权限检查
    print("1. 用户权限检查:")
    for role_name, user in users:
        if user:
            print(f"\n{role_name} ({user.username}):")
            print(f"  角色: {user.role.value}")
            print(f"  权限数量: {len(user.permissions)}")
            print(f"  权限列表: {[p.value for p in user.permissions]}")
    
    # 演示工具访问权限
    print("\n\n2. 工具访问权限:")
    tools_to_check = [
        "createItem",
        "deleteItem", 
        "setProjectField1",
        "setEntityField1",
        "setNoteField1",
        "setChartField1",
        "set_plan",
        "complete_plan"
    ]
    
    for role_name, user in users:
        if user:
            print(f"\n{role_name} 可访问的工具:")
            available_tools = get_available_tools_for_user(user)
            for tool in tools_to_check:
                can_access = can_access_tool(user, tool)
                status = "✓" if can_access else "✗"
                print(f"  {status} {tool}")
    
    # 演示权限检查函数
    print("\n\n3. 具体权限检查:")
    permissions_to_check = [
        Permission.WRITE_CANVAS,
        Permission.DELETE_CANVAS,
        Permission.CREATE_PROJECT,
        Permission.EDIT_PROJECT,
        Permission.ADMIN,
        Permission.MANAGE_USERS,
    ]
    
    for role_name, user in users:
        if user:
            print(f"\n{role_name} 权限详情:")
            for permission in permissions_to_check:
                has_perm = has_permission(user, permission)
                status = "✓" if has_perm else "✗"
                print(f"  {status} {permission.value}")
    
    # 演示权限感知的 Agent 创建
    print("\n\n4. 权限感知的 Agent 创建:")
    for role_name, user in users:
        if user:
            print(f"\n为 {role_name} 创建 Agent:")
            try:
                from agent import graph as original_graph
                agent = PermissionAwareAgent(original_graph)
                print(f"  ✓ 成功创建权限感知的 Agent")
                print(f"  ✓ 用户角色: {user.role.value}")
                print(f"  ✓ 可用工具数量: {len(get_available_tools_for_user(user))}")
            except Exception as e:
                print(f"  ✗ 创建失败: {e}")

def test_permission_denied_scenario():
    """测试权限不足的场景"""
    print("\n\n=== 权限不足场景测试 ===")
    
    # 模拟一个只有查看权限的用户尝试执行需要写权限的操作
    viewer_user = get_user("viewer")
    if viewer_user:
        print(f"\n用户: {viewer_user.username} (角色: {viewer_user.role.value})")
        
        # 检查各种权限
        write_permission = has_permission(viewer_user, Permission.WRITE_CANVAS)
        delete_permission = has_permission(viewer_user, Permission.DELETE_CANVAS)
        admin_permission = has_permission(viewer_user, Permission.ADMIN)
        
        print(f"写权限: {'✓' if write_permission else '✗'}")
        print(f"删除权限: {'✓' if delete_permission else '✗'}")
        print(f"管理员权限: {'✓' if admin_permission else '✗'}")
        
        # 模拟权限检查失败
        if not write_permission:
            print("\n❌ 权限不足：用户无法执行写操作")
            print("   建议：升级用户角色或联系管理员")
        
        if not delete_permission:
            print("❌ 权限不足：用户无法执行删除操作")
            print("   建议：升级用户角色或联系管理员")

if __name__ == "__main__":
    demonstrate_permission_system()
    test_permission_denied_scenario()

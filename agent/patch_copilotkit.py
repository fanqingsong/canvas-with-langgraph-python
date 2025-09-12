"""
Patch for CopilotKit import issue with LangGraph.
This file fixes the incorrect import path in copilotkit.langgraph_agent
"""

import sys

# First, we need to properly import langgraph modules
import langgraph
import langgraph.graph
import langgraph.graph.state

# Create a mock module for the incorrect import path
class MockModule:
    pass

# Now import the actual CompiledStateGraph from the correct location
from langgraph.graph.state import CompiledStateGraph

# The issue is that CopilotKit is trying to import from langgraph.graph.graph
# which doesn't exist. We need to create this fake module path and point it
# to the correct module.

# Create the fake module path that CopilotKit expects
mock_graph_module = MockModule()

# We need to find what CompiledGraph actually is
# Based on the error, it seems CopilotKit's langgraph_agent.py:8 is trying to import CompiledGraph
# Let's check if it's actually CompiledStateGraph
mock_graph_module.CompiledGraph = CompiledStateGraph

# Add it to sys.modules so the import will work
sys.modules['langgraph.graph.graph'] = mock_graph_module

print("CopilotKit patch applied successfully")
